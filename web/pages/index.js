import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout/Layout';
import HeroSection from '../components/HeroSection/HeroSection';
import CategoryCluster from '../components/CategoryCluster/CategoryCluster';

const CATEGORIES = ['All', 'AI & Future Tech', 'Tech', 'Business & Markets', 'Personal Finance'];

function slugifyCategory(cat) {
  return cat.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-').replace(/[^a-z0-9-]/g, '');
}

function unslugifyCategory(slug) {
  if (!slug) return 'All';
  return CATEGORIES.find(cat => slugifyCategory(cat) === slug) || 'All';
}

function stripHtml(html) {
  if (!html) return '';
  if (typeof window === 'undefined') return String(html).replace(/<[^>]+>/g, ' ');
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

async function fetchJsonWithRetry(url, options, { retries = 6, baseDelayMs = 250 } = {}) {
  let lastErr = null;
  const transientStatuses = new Set([502, 503, 504]);

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const res = await fetch(url, options);

      if (!res.ok) {
        if (transientStatuses.has(res.status) && attempt < retries - 1) {
          const delay = baseDelayMs * Math.pow(2, attempt);
          await new Promise((r) => setTimeout(r, delay));
          continue;
        }
        throw new Error(`Failed to load posts: ${res.status} ${res.statusText}`);
      }

      return await res.json();
    } catch (err) {
      lastErr = err;
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((r) => setTimeout(r, delay));
    }
  }

  throw lastErr;
}

export default function HomePage() {
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');

  // Sync activeCategory with URL query
  useEffect(() => {
    if (!router.isReady) return;
    const catSlug = router.query.category;
    const actualCat = unslugifyCategory(catSlug);
    if (actualCat !== activeCategory) {
      setActiveCategory(actualCat);
    }
  }, [router.query.category, router.isReady]);

  const handleCategoryChange = (cat) => {
    if (cat === 'All') {
      const { category, ...rest } = router.query;
      router.push({ pathname: '/', query: rest }, undefined, { shallow: true });
    } else {
      router.push({ pathname: '/', query: { ...router.query, category: slugifyCategory(cat) } }, undefined, { shallow: true });
    }
  };

  // Fetch user
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/me', { headers: { Accept: 'application/json' } });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
        }
      } catch (_) {
        // Not logged in or error
      }
    })();
  }, []);

  // Initialize Google Ads
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const adEls = document.querySelectorAll('ins.adsbygoogle');
      adEls.forEach((el) => {
        if (el.getAttribute('data-adsbygoogle-status') === 'done') return;
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch {
          // ignore
        }
      });
    } catch {
      // ignore
    }
  }, []);

  // Fetch posts
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchJsonWithRetry(
          '/api/posts',
          { headers: { Accept: 'application/json' } },
          { retries: 6, baseDelayMs: 250 }
        );

        setPosts(
          data.map((p) => ({
            ...p,
            date: p.date ? new Date(p.date) : null,
          }))
        );
      } catch (err) {
        console.error(err);
        setError('Could not load posts. Please try again later.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Filter posts
  const filteredPosts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const cat = activeCategory;

    let list = [...posts];

    if (cat !== 'All') {
      list = list.filter((p) => p.bucket === cat);
    }

    if (q) {
      list = list.filter((p) => {
        const text = (p.title + ' ' + p.excerpt + ' ' + stripHtml(p.content)).toLowerCase();
        return text.includes(q);
      });
    }

    return list;
  }, [posts, activeCategory, searchQuery]);

  // Group posts by category for clusters
  const postsByCategory = useMemo(() => {
    const categories = ['AI & Future Tech', 'Tech', 'Business & Markets', 'Personal Finance'];
    const grouped = {};
    
    categories.forEach(cat => {
      grouped[cat] = filteredPosts.filter(p => p.bucket === cat).slice(0, 5);
    });
    
    return grouped;
  }, [filteredPosts]);

  return (
    <Layout
      headerProps={{
        searchQuery,
        onSearchChange: setSearchQuery,
        activeCategory,
        onCategoryChange: handleCategoryChange,
        user
      }}
    >
      {/* Hero Section: 3-column layout */}
      <HeroSection 
        posts={filteredPosts.slice(0, 13)} 
        loading={loading}
      />

      {/* Error state */}
      {error && (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
          {error}
        </div>
      )}

      {/* Category Clusters */}
      {!loading && !error && (
        <>
          <CategoryCluster
            title="AI & Future Tech"
            posts={postsByCategory['AI & Future Tech']}
            loading={loading}
          />
          
          <CategoryCluster
            title="Tech"
            posts={postsByCategory['Tech']}
            loading={loading}
          />
          
          <CategoryCluster
            title="Business & Markets"
            posts={postsByCategory['Business & Markets']}
            loading={loading}
          />
          
          <CategoryCluster
            title="Personal Finance"
            posts={postsByCategory['Personal Finance']}
            loading={loading}
          />
        </>
      )}
    </Layout>
  );
}
