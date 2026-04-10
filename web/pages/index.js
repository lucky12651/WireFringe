import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useRouter } from 'next/router';
import Layout from '../components/Layout/Layout';
import HeroSection from '../components/HeroSection/HeroSection';
import CategoryCluster from '../components/CategoryCluster/CategoryCluster';
import { fetcher, api } from '../lib/api';
import Loader from '../components/Loader/Loader';
import SearchResults from '../components/SearchResults/SearchResults';

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

export async function getStaticProps() {
  try {
    const data = await api('/api/posts');
    return {
      props: {
        initialPosts: data || [],
      },
      revalidate: 60, // Revalidate every 60 seconds
    };
  } catch (err) {
    console.error('Error in getStaticProps:', err);
    return {
      props: {
        initialPosts: [],
      },
      revalidate: 10,
    };
  }
}

export default function HomePage({ initialPosts }) {
  const router = useRouter();
  const { data: postsData, error: postsError } = useSWR('/api/posts', fetcher, {
    fallbackData: initialPosts,
    revalidateOnFocus: false,
  });

  const posts = useMemo(() => {
    return (postsData || []).map((p) => ({
      ...p,
      date: p.date ? new Date(p.date) : null,
    }));
  }, [postsData]);

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [user, setUser] = useState(null);

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

  const loading = !postsData && !postsError;
  const error = postsError ? 'Could not load posts. Please try again later.' : '';

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
      grouped[cat] = filteredPosts.filter(p => p.bucket === cat).slice(0, 6);
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
      {loading ? (
        <div style={{ height: '70vh', display: 'flex', alignItems: 'center' }}>
          <Loader />
        </div>
      ) : searchQuery.trim() ? (
        <SearchResults 
          results={filteredPosts} 
          query={searchQuery} 
        />
      ) : (
        <>
          {/* Hero Section: 3-column layout */}
          <HeroSection 
            posts={filteredPosts.slice(0, 13)} 
          />

          {/* Error state */}
          {error && (
            <div style={{ textAlign: 'center', padding: '10px', color: 'var(--text-secondary)' }}>
              {error}
            </div>
          )}

          {/* Category Clusters */}
          {!error && (
            <>
              <CategoryCluster
                title="AI & Future Tech"
                posts={postsByCategory['AI & Future Tech']}
              />
              
              <CategoryCluster
                title="Tech"
                posts={postsByCategory['Tech']}
              />
              
              <CategoryCluster
                title="Business & Markets"
                posts={postsByCategory['Business & Markets']}
              />
              
              <CategoryCluster
                title="Personal Finance"
                posts={postsByCategory['Personal Finance']}
              />
            </>
          )}
        </>
      )}
    </Layout>
  );
}
