from __future__ import annotations

import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func, delete

from ..models import User, Post, UserInteraction, PersonalizedFeed
from ..repositories import PostRepository, UserRepository

logger = logging.getLogger(__name__)

class RecommendationService:
    def __init__(self, db: Session):
        self.db = db
        self.post_repo = PostRepository(db)
        self.user_repo = UserRepository(db)

    def update_all_recommendations(self):
        """Pre-calculate personalized feeds for all active users."""
        logger.info("Starting batch recommendation update...")
        start_time = datetime.utcnow()

        # 1. Get all active categories (buckets)
        categories = [c[0] for c in self.db.query(Post.bucket).distinct().all() if c[0]]
        if not categories:
            logger.warning("No categories found. Skipping recommendation update.")
            return

        # 2. Build the user-category interaction matrix with temporal decay and weighting
        # We consider interactions from the last 30 days
        since_date = datetime.utcnow() - timedelta(days=30)
        
        # Interaction weights
        WEIGHTS = {
            "view": 1.0,
            "like": 3.0,
            "share": 5.0,
            "comment": 4.0
        }

        raw_interactions = (
            self.db.query(
                UserInteraction.user_id, 
                Post.bucket, 
                UserInteraction.interaction_type,
                UserInteraction.created_at
            )
            .join(Post, UserInteraction.post_id == Post.id)
            .filter(UserInteraction.created_at >= since_date)
            .all()
        )

        user_vectors = {}
        for uid, bucket, itype, created_at in raw_interactions:
            if uid not in user_vectors:
                user_vectors[uid] = {cat: 0.0 for cat in categories}
            
            if bucket in user_vectors[uid]:
                # Temporal decay: weight = 1.0 at day 0, 0.1 at day 30
                days_old = (datetime.utcnow() - created_at).days
                decay = max(0.1, 1.0 - (days_old / 30.0))
                
                weight = WEIGHTS.get(itype, 1.0)
                user_vectors[uid][bucket] += weight * decay

        # Noise Cancellation: Filter out users with very low total activity
        active_user_vectors = {
            uid: vec for uid, vec in user_vectors.items() 
            if sum(vec.values()) > 2.0 # Threshold of 2.0 weighted interactions
        }

        all_user_ids = [u[0] for u in self.db.query(User.id).all()]
        
        # 3. Process each user
        for user_id in all_user_ids:
            try:
                self._calculate_for_user(user_id, active_user_vectors, categories)
            except Exception as e:
                logger.error(f"Failed to calculate recommendations for user {user_id}: {e}")

        duration = datetime.utcnow() - start_time
        logger.info(f"Recommendation update completed in {duration.total_seconds():.2f}s")

    def _calculate_for_user(self, user_id: int, user_vectors: dict, categories: list):
        """Calculate and store recommendations for a single user."""
        limit = 30 # Store top 30 recommendations
        
        if user_id not in user_vectors:
            # No interaction data, maybe just store latest posts as generic recs or skip
            return

        target_vector = user_vectors[user_id]
        total_own = sum(target_vector.values()) or 1

        # K-Nearest Neighbors
        K = 5
        similarities = []
        for uid, vector in user_vectors.items():
            if uid == user_id:
                continue
            
            # Euclidean distance (CPU optimized: no sqrt needed for comparison, but we'll use it for weighting)
            dist_sq = sum((target_vector[cat] - vector[cat]) ** 2 for cat in categories)
            distance = dist_sq ** 0.5
            similarities.append((uid, distance))

        neighbors = sorted(similarities, key=lambda x: x[1])[:K]

        # Aggregate category scores
        cat_scores = {}
        # Own interests (weight 2.0)
        for cat, count in target_vector.items():
            cat_scores[cat] = (count / total_own) * 2.0

        # Neighbor interests
        for neighbor_id, distance in neighbors:
            n_vector = user_vectors[neighbor_id]
            n_total = sum(n_vector.values()) or 1
            weight = 1.0 / (distance + 1.0)
            for cat, count in n_vector.items():
                cat_scores[cat] = cat_scores.get(cat, 0) + (count / n_total) * weight

        # Get top categories
        top_cats = sorted(cat_scores.items(), key=lambda x: x[1], reverse=True)

        # Get posts user hasn't seen
        seen_post_ids = {i[0] for i in self.db.query(UserInteraction.post_id).filter(UserInteraction.user_id == user_id).all()}
        
        recommended_posts = []
        for cat, score in top_cats:
            if score <= 0: continue
            
            posts = (
                self.db.query(Post.id)
                .filter(Post.bucket == cat)
                .filter(Post.id.notin_(seen_post_ids))
                .order_by(Post.published_at.desc())
                .limit(10)
                .all()
            )
            for p in posts:
                recommended_posts.append((p[0], score))
            
            if len(recommended_posts) >= limit:
                break

        # Save to database
        if recommended_posts:
            # Clear existing recs for this user
            self.db.execute(delete(PersonalizedFeed).where(PersonalizedFeed.user_id == user_id))
            
            # Batch insert
            for post_id, score in recommended_posts[:limit]:
                rec = PersonalizedFeed(
                    user_id=user_id,
                    post_id=post_id,
                    score=float(score)
                )
                self.db.add(rec)
            
            self.db.commit()
