import { useState, useEffect, useCallback } from 'react';
import { getSupabaseClient } from '../services/supabaseClient';
import { BrandVoice } from '../types';
import { toast } from 'react-hot-toast';

const supabase = getSupabaseClient();

interface UseBrandVoicesReturn {
  voices: BrandVoice[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createVoice: (voice: Omit<BrandVoice, 'id' | 'created_at' | 'updated_at'>) => Promise<BrandVoice | null>;
  updateVoice: (id: string, updates: Partial<Omit<BrandVoice, 'id' | 'created_at' | 'updated_at'>>) => Promise<boolean>;
  deleteVoice: (id: string) => Promise<boolean>;
}

export const useBrandVoices = (customerId?: string): UseBrandVoicesReturn => {
  const [voices, setVoices] = useState<BrandVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVoices = useCallback(async () => {
    if (!customerId) {
      setVoices([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('pmc_public_brand_voices')
        .select('*')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setVoices(data || []);
    } catch (err: any) {
      console.error('Error fetching brand voices:', err);
      const errorMsg = `Failed to load brand voices: ${err.message}`;
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    fetchVoices();
  }, [fetchVoices]);

  const createVoice = async (voice: Omit<BrandVoice, 'id' | 'created_at' | 'updated_at'>): Promise<BrandVoice | null> => {
    try {
      const { data, error: insertError } = await supabase
        .from('pmc_public_brand_voices')
        .insert({
          ...voice,
          personality_traits: voice.personality_traits || [],
          preferred_vocabulary: voice.preferred_vocabulary || [],
          forbidden_terms: voice.forbidden_terms || [],
          punctuation_rules: voice.punctuation_rules || {}
        })
        .select()
        .single();

      if (insertError) throw insertError;

      toast.success('Brand voice created successfully!');
      await fetchVoices();
      return data;
    } catch (err: any) {
      console.error('Error creating brand voice:', err);
      toast.error(`Failed to create brand voice: ${err.message}`);
      return null;
    }
  };

  const updateVoice = async (id: string, updates: Partial<Omit<BrandVoice, 'id' | 'created_at' | 'updated_at'>>): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('pmc_public_brand_voices')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      toast.success('Brand voice updated successfully!');
      await fetchVoices();
      return true;
    } catch (err: any) {
      console.error('Error updating brand voice:', err);
      toast.error(`Failed to update brand voice: ${err.message}`);
      return false;
    }
  };

  const deleteVoice = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('pmc_public_brand_voices')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      toast.success('Brand voice deleted successfully!');
      await fetchVoices();
      return true;
    } catch (err: any) {
      console.error('Error deleting brand voice:', err);
      toast.error(`Failed to delete brand voice: ${err.message}`);
      return false;
    }
  };

  return {
    voices,
    loading,
    error,
    refetch: fetchVoices,
    createVoice,
    updateVoice,
    deleteVoice
  };
};
