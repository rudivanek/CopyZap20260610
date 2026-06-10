import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, MessageSquare } from 'lucide-react';
import { useBrandVoices } from '../hooks/useBrandVoices';
import { useAuth } from '../hooks/useAuth';
import { getSupabaseClient } from '../services/supabaseClient';
import LoadingSpinner from './ui/LoadingSpinner';
import PublicFooter from './PublicFooter';
import BrandVoiceCard from './BrandVoiceCard';
import BrandVoiceModal from './BrandVoiceModal';
import { BrandVoice } from '../types';

const supabase = getSupabaseClient();

interface CustomerDetailProps {
  customerId?: string;
  customerName?: string;
}

const CustomerDetail: React.FC<CustomerDetailProps> = ({ customerId: propCustomerId, customerName: propCustomerName }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const customerId = propCustomerId || params.customerId;
  const [customerName, setCustomerName] = useState(propCustomerName || (location.state as any)?.customerName || 'Customer');
  const [loadingCustomer, setLoadingCustomer] = useState(!propCustomerName && !(location.state as any)?.customerName);

  useEffect(() => {
    const fetchCustomerName = async () => {
      if (!customerId || customerName !== 'Customer') return;

      try {
        const { data, error } = await supabase
          .from('pmc_customers')
          .select('name')
          .eq('id', customerId)
          .single();

        if (error) throw error;
        if (data) setCustomerName(data.name);
      } catch (error) {
        console.error('Error fetching customer name:', error);
      } finally {
        setLoadingCustomer(false);
      }
    };

    fetchCustomerName();
  }, [customerId, customerName]);

  const { voices, loading, createVoice, updateVoice, deleteVoice } = useBrandVoices(customerId);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVoice, setEditingVoice] = useState<BrandVoice | null>(null);

  const handleAddVoice = () => {
    setEditingVoice(null);
    setIsModalOpen(true);
  };

  const handleEditVoice = (voice: BrandVoice) => {
    setEditingVoice(voice);
    setIsModalOpen(true);
  };

  const handleDeleteVoice = async (voice: BrandVoice) => {
    if (window.confirm(`Are you sure you want to delete "${voice.name}"?\n\nThis action cannot be undone.`)) {
      await deleteVoice(voice.id);
    }
  };

  const handleSaveVoice = async (voiceData: Omit<BrandVoice, 'id' | 'created_at' | 'updated_at'>) => {
    if (editingVoice) {
      await updateVoice(editingVoice.id, voiceData);
    } else {
      await createVoice(voiceData);
    }
    setIsModalOpen(false);
    setEditingVoice(null);
  };

  if (!customerId) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400">No customer selected</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate('/manage-customers')}
            className="flex items-center text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            Back to Customers
          </button>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800 p-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {customerName}
          </h1>

          {/* Brand Voices Section */}
          <div className="mt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <MessageSquare size={28} className="text-primary-600 dark:text-primary-400 mr-3" />
                  Brand Voices
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Define how this brand should sound across all copy
                </p>
              </div>
              <button
                onClick={handleAddVoice}
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center shadow-md hover:shadow-lg"
              >
                <Plus size={20} className="mr-2" />
                Add Brand Voice
              </button>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner />
              </div>
            ) : voices.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <MessageSquare size={48} className="text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">
                  No brand voices yet
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-sm mb-6">
                  Create your first brand voice to ensure consistent messaging
                </p>
                <button
                  onClick={handleAddVoice}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors inline-flex items-center"
                >
                  <Plus size={18} className="mr-2" />
                  Add Your First Brand Voice
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {voices.map(voice => (
                  <BrandVoiceCard
                    key={voice.id}
                    voice={voice}
                    onEdit={() => handleEditVoice(voice)}
                    onDelete={() => handleDeleteVoice(voice)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <BrandVoiceModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingVoice(null);
        }}
        onSave={handleSaveVoice}
        customerId={customerId}
        userId={currentUser?.id || ''}
        editingVoice={editingVoice}
      />

      <PublicFooter />
    </div>
  );
};

export default CustomerDetail;
