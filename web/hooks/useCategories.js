import { useState, useCallback, useMemo } from 'react';
import { categoriesApi } from '../lib/api';

export function useCategories() {
  const [categories, setCategories] = useState([]);
  const [categoriesWithCounts, setCategoriesWithCounts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const refreshCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await categoriesApi.list();
      setCategories(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to fetch categories');
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshCategoriesWithCounts = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await categoriesApi.listWithCounts();
      setCategoriesWithCounts(data || []);
    } catch (err) {
      setError(err?.message || 'Failed to fetch categories');
      setCategoriesWithCounts([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createCategory = useCallback(async (name) => {
    try {
      setIsLoading(true);
      setError(null);
      const created = await categoriesApi.create(name);
      await refreshCategories();
      await refreshCategoriesWithCounts();
      return { success: true, category: created };
    } catch (err) {
      setError(err?.message || 'Failed to create category');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, [refreshCategories, refreshCategoriesWithCounts]);

  const deleteCategory = useCallback(async (id) => {
    try {
      setIsLoading(true);
      setError(null);
      await categoriesApi.delete(id);
      await refreshCategories();
      await refreshCategoriesWithCounts();
      return { success: true };
    } catch (err) {
      setError(err?.message || 'Failed to delete category');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, [refreshCategories, refreshCategoriesWithCounts]);

  const categoryNames = useMemo(() => {
    return categories.map((c) => c.name).sort((a, b) => a.localeCompare(b));
  }, [categories]);

  return useMemo(
    () => ({
      categories,
      categoriesWithCounts,
      categoryNames,
      isLoading,
      error,
      refreshCategories,
      setCategories,
      refreshCategoriesWithCounts,
      setCategoriesWithCounts,
      createCategory,
      deleteCategory,
      setError,
    }),
    [
      categories,
      setCategories,
      categoriesWithCounts,
      setCategoriesWithCounts,
      categoryNames,
      isLoading,
      error,
      refreshCategories,
      refreshCategoriesWithCounts,
      createCategory,
      deleteCategory,
    ]
  );
}
