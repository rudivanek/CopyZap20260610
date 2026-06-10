import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import NavSidebar from './NavSidebar';
import { BarChart3, FileText, Settings, DollarSign, Users, RefreshCw, Calendar, Zap, Eye, Trash2, CreditCard as Edit, ArrowRight, User, AlertCircle, Filter, Download, Lightbulb, BookOpen, Activity, ChevronDown, ChevronRight, Workflow, Star, Search, X } from 'lucide-react';
import { retryFailedTracking, getTrackingQueueStatus } from '../services/api/tokenTracking';
import { useAuth } from '../hooks/useAuth';
import { useIsAdmin } from '../hooks/useIsAdmin';
import LoadingSpinner from './ui/LoadingSpinner';
import PublicFooter from './PublicFooter';
import {
  getUserCopySessions,
  getUserTemplates,
  getUserTokenUsage,
  getUserSavedOutputsMeta, // Use meta version for Dashboard listing
  getUserSubscriptionData,
  getMockCopySessions,
  getMockSavedOutputs,
  getMockSubscriptionData,
  deleteCopySession,
  deleteTemplate,
  deleteSavedOutput,
  toggleSavedOutputFavorite,
  renameTemplate,
  adminGetTokenUsage,
  adminGetTokenStats,
  adminGetAllTokenUsageForExport,
  adminGetBetaRegistrationsCount,
  adminGetUsers,
  getCreditsBalance,
  supabase,
  type CreditsBalance
} from '../services/supabaseClient';
import { CopySession, Template, SavedOutputMeta } from '../types'; // Use SavedOutputMeta for listings
import { toast } from 'react-hot-toast';
import { getOperationLabel } from '../utils/operationLabels';
import { startTrace, endTrace, trace } from '../utils/performanceTrace';

// Define CreditsUsage interface for tracking credit consumption
interface CreditsUsage {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  operation_type: string;
  model: string;
  tokens_used: number; // Internal tracking only
  cost_usd: number;
  billable_units?: number;
  billing_rule_name?: string;
  pricing_tier?: string;
  created_at: string;
  session_name?: string;
  session_id?: string;
  input_tokens_used?: number;
  output_tokens_used?: number;
  reasoning_tokens_used?: number;
  cost_source?: string;
  pricing_row_id?: string;
}

// Phase 4B-2: total_tokens removed (credits-only)
interface SessionSummary {
  session_id: string;
  session_name: string;
  total_cost: number;
  total_billable_units: number;
  api_calls: number;
  details: CreditsUsage[];
}

// Import Supabase enabled flag from environment variables
const SUPABASE_ENABLED = import.meta.env.VITE_SUPABASE_ENABLED === 'true';

// Phase 4B-2: totalTokensUsed removed (credits-only)
interface DashboardStats {
  totalSessions: number;
  totalTemplates: number;
  totalCost: number;
  totalBillableUnits: number; // User-facing as "Credits"
  totalSavedOutputs: number;
}

interface DashboardUser {
  id: string;
  email: string;
  name: string;
}

const Dashboard: React.FC<{ userId: string; onLogout: () => void }> = ({ userId, onLogout }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // State
  const [copySessions, setCopySessions] = useState<CopySession[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [creditsUsage, setCreditsUsage] = useState<CreditsUsage[]>([]);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [sessionSummaries, setSessionSummaries] = useState<Map<string, SessionSummary>>(new Map());
  const [savedOutputs, setSavedOutputs] = useState<SavedOutputMeta[]>([]); // Use SavedOutputMeta for list view

  // Pagination state
  const [hasMoreSessions, setHasMoreSessions] = useState(false);
  const [hasMoreTemplates, setHasMoreTemplates] = useState(false);
  const [hasMoreOutputs, setHasMoreOutputs] = useState(false);
  const [loadingMoreSessions, setLoadingMoreSessions] = useState(false);
  const [loadingMoreTemplates, setLoadingMoreTemplates] = useState(false);
  const [loadingMoreOutputs, setLoadingMoreOutputs] = useState(false);
  const [allUsers, setAllUsers] = useState<DashboardUser[]>([]);
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('all');
  const [betaRegistrationsCount, setBetaRegistrationsCount] = useState<number | null>(null);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [creditsBalance, setCreditsBalance] = useState<CreditsBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCreditsUsage, setLoadingCreditsUsage] = useState(false);
  const [creditsUsageLoaded, setCreditsUsageLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('copyZap_dashboardTab');
    if (savedTab && ['sessions', 'templates', 'savedOutputs', 'creditsUsage'].includes(savedTab)) {
      return savedTab;
    }
    return 'sessions';
  });
  const [stats, setStats] = useState<DashboardStats>({
    totalSessions: 0,
    totalTemplates: 0,
    totalCost: 0,
    totalBillableUnits: 0,
    totalSavedOutputs: 0
  });

  // Credits usage pagination and filtering state
  const [creditsPage, setCreditsPage] = useState(0);
  const [creditsPageSize] = useState(100);
  const [creditsTotalRecords, setCreditsTotalRecords] = useState(0);
  const [creditsHasMore, setCreditsHasMore] = useState(false);
  const [creditsAggregatedStats, setCreditsAggregatedStats] = useState({
    totalTokens: 0, // Internal tracking only
    totalCost: 0,
    totalBillableUnits: 0, // User-facing as "Credits"
    recordCount: 0
  });

  // State to store the filtered user's credit allowance (admin only)
  const [filteredUserCreditsAllowed, setFilteredUserCreditsAllowed] = useState<number | null>(null);

  // Date range filter - default to last 30 days
  const getDefaultDateRange = () => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange());

  // Check if current user is admin using centralized admin service
  const { isAdmin } = useIsAdmin(currentUser);

  // Rename template state
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [editingTemplateName, setEditingTemplateName] = useState<string>('');

  // Saved outputs filter state
  const [savedOutputsFilter, setSavedOutputsFilter] = useState<'all' | 'favorites'>('all');
  const [savedOutputsSearchText, setSavedOutputsSearchText] = useState<string>('');

  // CSV export function for credits usage - fetches ALL matching records
  const exportCreditsUsageToCSV = useCallback(async () => {
    if (creditsUsage.length === 0) {
      toast.error('No data to export');
      return;
    }

    try {
      toast.loading('Fetching all records for export...');

      let allRecords: CreditsUsage[] = [];

      if (isAdmin) {
        // For admin, fetch ALL records with filters (no pagination)
        const result = await adminGetAllTokenUsageForExport(
          dateRange.start,
          dateRange.end,
          selectedUserFilter
        );
        if (result.data) {
          allRecords = result.data;
        }
      } else {
        // For regular users, fetch all their records
        const result = await getUserTokenUsage(userId, dateRange.start, dateRange.end);
        if (result.data) {
          allRecords = result.data.map((usage: any) => ({
            id: usage.id,
            user_id: usage.user_id,
            user_email: currentUser?.email || '',
            user_name: currentUser?.email || '',
            operation_type: usage.operation_type,
            model: usage.model,
            tokens_used: usage.tokens_used,
            cost_usd: usage.cost_usd,
            billable_units: usage.billable_units || 0,
            billing_rule_name: usage.billing_rule_name || null,
            pricing_tier: usage.pricing_tier || null,
            created_at: usage.created_at
          }));
        }
      }

      toast.dismiss();

      if (allRecords.length === 0) {
        toast.error('No records found matching the filters');
        return;
      }

      // Define CSV headers - All columns
      const headers = [
        'ID',
        'User ID',
        'User Email',
        'Operation Type',
        'Model',
        'Cost USD',
        'Credits',
        'Billing Rule',
        'Pricing Tier',
        'Input Tokens',
        'Output Tokens',
        'Reasoning Tokens',
        'Cost Source',
        'Pricing Row ID',
        'Session ID',
        'Session Name',
        'Created At'
      ];

      // Convert data to CSV rows
      const csvRows = allRecords.map(usage => {
        return [
          `"${usage.id || ''}"`,
          `"${usage.user_id || ''}"`,
          `"${usage.user_email || ''}"`,
          `"${getOperationLabel(usage.operation_type || '')}"`,
          `"${usage.model || ''}"`,
          `${usage.cost_usd || 0}`,
          `${usage.billable_units || 0}`,
          `"${usage.billing_rule_name || ''}"`,
          `"${usage.pricing_tier || ''}"`,
          `${usage.input_tokens_used || 0}`,
          `${usage.output_tokens_used || 0}`,
          `${usage.reasoning_tokens_used || 0}`,
          `"${usage.cost_source || ''}"`,
          `"${usage.pricing_row_id || ''}"`,
          `"${usage.session_id || ''}"`,
          `"${usage.session_name || ''}"`,
          `"${usage.created_at || ''}"`
        ].join(',');
      });

      // Combine headers and data
      const csvContent = [headers.join(','), ...csvRows].join('\n');

      // Create and download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);

      link.setAttribute('href', url);
      link.setAttribute('download', `credits-usage-${dateRange.start}-to-${dateRange.end}-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${allRecords.length} records to CSV!`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.dismiss();
      toast.error('Failed to export CSV');
    }
  }, [creditsUsage, dateRange, isAdmin, selectedUserFilter, userId, currentUser]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6
    }).format(amount);
  };

  const formatCostUSD = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 5,
      maximumFractionDigits: 5
    }).format(amount);
  };

  // Load user data
  const loadUserData = useCallback(async () => {
    setLoading(true);

    // Start performance trace
    const traceId = startTrace('dashboard-mount');

    // DEBUG: Check current auth session
    console.log('=== DASHBOARD DEBUG ===');
    console.log('userId prop:', userId);
    console.log('currentUser:', currentUser);
    console.log('currentUser.id:', currentUser?.id);
    console.log('currentUser.email:', currentUser?.email);

    try {
      if (!SUPABASE_ENABLED) {
        // Use mock data if Supabase is not enabled
        setCopySessions(getMockCopySessions());
        setSavedOutputs(getMockSavedOutputs());
        setSubscriptionData(getMockSubscriptionData());
        setLoading(false);
        endTrace(traceId);
        return;
      }

      // Timeout helper for database queries
      const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
          )
        ]);
      };

      // Load user-specific data with timeout protection and performance tracing
      const [
        sessionsResult,
        templatesResult,
        savedOutputsResult,
        subscriptionResult,
        creditsBalanceResult
      ] = await Promise.all([
        trace('getUserCopySessions', () => withTimeout(getUserCopySessions(userId), 10000)).catch(err => ({ data: null, error: err })),
        trace('getUserTemplates', () => withTimeout(getUserTemplates(userId), 10000)).catch(err => ({ data: null, error: err })),
        trace('getUserSavedOutputsMeta', () => withTimeout(getUserSavedOutputsMeta(userId), 10000)).catch(err => ({ data: null, error: err })),
        trace('getUserSubscriptionData', () => withTimeout(getUserSubscriptionData(userId), 10000)).catch(err => ({ data: null, error: err })),
        trace('getCreditsBalance', () => withTimeout(getCreditsBalance(userId), 10000)).catch(err => ({ data: null, error: err }))
      ]);

      console.log('=== SESSIONS RESULT ===');
      console.log('sessionsResult:', sessionsResult);
      console.log('sessionsResult.data length:', sessionsResult.data?.length || 0);
      console.log('sessionsResult.error:', sessionsResult.error);

      if (sessionsResult.data) {
        setCopySessions(sessionsResult.data);
        setHasMoreSessions(sessionsResult.data.length === 50); // If we got 50, there might be more
      }
      if (templatesResult.data) {
        setTemplates(templatesResult.data);
        setHasMoreTemplates(templatesResult.data.length === 100); // If we got 100, there might be more
      }
      if (savedOutputsResult.data) {
        setSavedOutputs(savedOutputsResult.data);
        setHasMoreOutputs(savedOutputsResult.data.length === 50); // If we got 50, there might be more
      }
      if (subscriptionResult.data) {
        console.log('🔍 Subscription data received:', subscriptionResult.data);
        console.log('🔍 Has credit_plans?', subscriptionResult.data.credit_plans);
        setSubscriptionData(subscriptionResult.data);
      }
      if (creditsBalanceResult.data) setCreditsBalance(creditsBalanceResult.data);

      // Load admin-specific data if user is admin - WITHOUT token usage (loaded on-demand)
      if (isAdmin) {
        // Run admin requests in parallel with timeout protection and tracing (reuse withTimeout from above)
        const [betaCountResult, usersResult] = await Promise.allSettled([
          trace('adminGetBetaRegistrationsCount', () => withTimeout(adminGetBetaRegistrationsCount(), 5000)).catch(err => ({ data: null, error: err })),
          trace('adminGetUsers', () => withTimeout(adminGetUsers(), 5000)).catch(err => ({ data: null, error: err }))
        ]);

        // Process beta count
        if (betaCountResult.status === 'fulfilled' && betaCountResult.value.data !== null) {
          setBetaRegistrationsCount(betaCountResult.value.data);
        } else if (betaCountResult.status === 'rejected') {
          console.error('Error loading beta registrations count:', betaCountResult.reason);
        }

        // Process users
        if (usersResult.status === 'fulfilled' && usersResult.value.data) {
          setAllUsers(usersResult.value.data.map((user: any) => ({
            id: user.id,
            email: user.email,
            name: user.email
          })));
        } else if (usersResult.status === 'rejected') {
          console.error('Error loading users:', usersResult.reason);
        }
      }
      // Note: Token usage is now loaded on-demand when user clicks Token Usage tab

      if (sessionsResult.error) console.error('Error loading sessions:', sessionsResult.error);
      if (savedOutputsResult.error) console.error('Error loading saved outputs:', savedOutputsResult.error);
      if (subscriptionResult.error) console.error('Error loading subscription data:', subscriptionResult.error);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
      endTrace(traceId);
    }
  }, [userId, isAdmin]);

  // Load more sessions with stable cursor pagination
  const loadMoreSessions = useCallback(async () => {
    if (loadingMoreSessions || !hasMoreSessions || copySessions.length === 0) return;

    setLoadingMoreSessions(true);
    try {
      // Use composite cursor (created_at, id) to prevent duplicates/gaps
      const lastSession = copySessions[copySessions.length - 1];
      const cursor = {
        created_at: lastSession.created_at,
        id: lastSession.id
      };

      const result = await getUserCopySessions(userId, 50, cursor);
      if (result.data && result.data.length > 0) {
        setCopySessions([...copySessions, ...result.data]);
        setHasMoreSessions(result.data.length === 50);
      } else {
        setHasMoreSessions(false);
      }
    } catch (error) {
      console.error('Error loading more sessions:', error);
      toast.error('Failed to load more sessions');
    } finally {
      setLoadingMoreSessions(false);
    }
  }, [userId, copySessions, hasMoreSessions, loadingMoreSessions]);

  // Load more templates with stable cursor pagination
  const loadMoreTemplates = useCallback(async () => {
    if (loadingMoreTemplates || !hasMoreTemplates || templates.length === 0) return;

    setLoadingMoreTemplates(true);
    try {
      // Use composite cursor (created_at, id) to prevent duplicates/gaps
      const lastTemplate = templates[templates.length - 1];
      const cursor = {
        created_at: lastTemplate.created_at,
        id: lastTemplate.id || ''
      };

      const result = await getUserTemplates(userId, 100, cursor);
      if (result.data && result.data.length > 0) {
        setTemplates([...templates, ...result.data]);
        setHasMoreTemplates(result.data.length === 100);
      } else {
        setHasMoreTemplates(false);
      }
    } catch (error) {
      console.error('Error loading more templates:', error);
      toast.error('Failed to load more templates');
    } finally {
      setLoadingMoreTemplates(false);
    }
  }, [userId, templates, hasMoreTemplates, loadingMoreTemplates]);

  // Load more saved outputs with stable cursor pagination
  const loadMoreOutputs = useCallback(async () => {
    if (loadingMoreOutputs || !hasMoreOutputs || savedOutputs.length === 0) return;

    setLoadingMoreOutputs(true);
    try {
      // Use composite cursor (created_at, id) to prevent duplicates/gaps
      const lastOutput = savedOutputs[savedOutputs.length - 1];
      const cursor = {
        created_at: lastOutput.created_at,
        id: lastOutput.id || ''
      };

      const result = await getUserSavedOutputsMeta(userId, 50, cursor);
      if (result.data && result.data.length > 0) {
        setSavedOutputs([...savedOutputs, ...result.data]);
        setHasMoreOutputs(result.data.length === 50);
      } else {
        setHasMoreOutputs(false);
      }
    } catch (error) {
      console.error('Error loading more outputs:', error);
      toast.error('Failed to load more saved outputs');
    } finally {
      setLoadingMoreOutputs(false);
    }
  }, [userId, savedOutputs, hasMoreOutputs, loadingMoreOutputs]);

  // Calculate stats
  useEffect(() => {
    const userCost = isAdmin ? creditsAggregatedStats.totalCost : creditsAggregatedStats.totalCost;
    const userBillableUnits = isAdmin ? creditsAggregatedStats.totalBillableUnits : creditsAggregatedStats.totalBillableUnits;

    setStats({
      totalSessions: copySessions.length,
      totalTemplates: templates.length,
      totalCost: userCost,
      totalBillableUnits: userBillableUnits,
      totalSavedOutputs: savedOutputs.length
    });
  }, [copySessions, templates, creditsAggregatedStats, savedOutputs, isAdmin]);

  // Load data on component mount
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  // Separate effect for background retry to avoid constant re-initialization
  useEffect(() => {
    // Start background retry of failed token tracking
    const retryInterval = setInterval(() => {
      retryFailedTracking().catch(console.error);
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(retryInterval);
  }, []); // Only run once on mount

  // Group credits usage by session
  const groupBySession = (creditsData: CreditsUsage[]): Map<string, SessionSummary> => {
    const sessionMap = new Map<string, SessionSummary>();

    creditsData.forEach(usage => {
      const sessionId = usage.session_id || 'no-session';
      // Handle recovered sessions and provide fallback for truly null session_ids
      const sessionName = usage.session_name || 'Legacy Session';

      if (!sessionMap.has(sessionId)) {
        sessionMap.set(sessionId, {
          session_id: sessionId,
          session_name: sessionName,
          total_cost: 0,
          total_billable_units: 0,
          api_calls: 0,
          details: []
        });
      }

      const session = sessionMap.get(sessionId)!;
      // Phase 4B-2: total_tokens removed (credits-only)
      session.total_cost += usage.cost_usd;
      session.total_billable_units += (usage.billable_units || 0);
      session.api_calls += 1;
      session.details.push(usage);
    });

    return sessionMap;
  };

  // Fetch filtered user's credits allowed (admin only)
  const fetchFilteredUserCreditsAllowed = useCallback(async (userId: string) => {
    if (!isAdmin || userId === 'all') {
      setFilteredUserCreditsAllowed(null);
      return;
    }

    try {
      console.log('🔍 Fetching credits_allowed for user:', userId);
      const { data: userData, error: userError } = await supabase
        .from('pmc_users')
        .select('credits_allowed')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('❌ Error fetching user credits allowed:', userError);
        setFilteredUserCreditsAllowed(null);
        return;
      }

      if (!userData) {
        console.warn('⚠️ No user data found for user:', userId);
        setFilteredUserCreditsAllowed(null);
        return;
      }

      const creditsAllowed = userData.credits_allowed ?? 0;
      console.log('✅ Credits allowed fetched:', creditsAllowed);
      setFilteredUserCreditsAllowed(creditsAllowed);
    } catch (error) {
      console.error('❌ Exception fetching user credits allowed:', error);
      setFilteredUserCreditsAllowed(null);
    }
  }, [isAdmin]);

  // Load credits usage on-demand with client-side pagination and filtering
  const loadCreditsUsage = useCallback(async (page: number = 0, resetData: boolean = false) => {
    if (loadingCreditsUsage && !resetData) return; // Prevent concurrent loads

    setLoadingCreditsUsage(true);

    // Start performance trace for credits usage loading
    const traceId = startTrace(`credits-usage-load-page-${page}`);

    // Fetch filtered user's credits allowed if admin and specific user selected
    if (isAdmin && selectedUserFilter !== 'all') {
      await fetchFilteredUserCreditsAllowed(selectedUserFilter);
    } else {
      setFilteredUserCreditsAllowed(null);
    }

    try {
      const withTimeout = <T,>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> => {
        return Promise.race([
          promise,
          new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
          )
        ]);
      };

      if (isAdmin) {
        // Use edge function for admin with proper aggregation
        console.log('=== SENDING TO API ===');
        console.log('dateRange.start:', dateRange.start);
        console.log('dateRange.end:', dateRange.end);
        console.log('page:', page, 'pageSize:', creditsPageSize, 'offset:', page * creditsPageSize);

        const result = await trace('adminGetTokenStats', () => withTimeout(
          adminGetTokenStats({
            startDate: dateRange.start,
            endDate: dateRange.end,
            userId: selectedUserFilter,
            limit: creditsPageSize,
            offset: page * creditsPageSize
          }),
          10000
        ));

        if (result.data) {
          console.log('=== RECEIVED DATA FROM API ===');
          console.log('Total records:', result.data.data?.length);
          console.log('First 5 records:', result.data.data?.slice(0, 5).map((r: any) => ({
            created_at: r.created_at,
            session_id: r.session_id?.substring(0, 8),
            session_name: r.session_name
          })));
          console.log('Last 5 records:', result.data.data?.slice(-5).map((r: any) => ({
            created_at: r.created_at,
            session_id: r.session_id?.substring(0, 8),
            session_name: r.session_name
          })));

          const firstRec = result.data.data?.[0];
          console.log('=== FULL FIRST RECORD ===');
          console.log('All keys:', firstRec ? Object.keys(firstRec) : 'no record');
          console.log('session_id:', firstRec?.session_id);
          console.log('session_name:', firstRec?.session_name);
          console.log('Full record:', JSON.stringify(firstRec, null, 2));

          const creditsData = result.data.data;

          if (resetData || page === 0) {
            setCreditsUsage(creditsData);
            // Group by session
            setSessionSummaries(groupBySession(creditsData));
          } else {
            const combinedData = [...creditsUsage, ...creditsData];
            setCreditsUsage(combinedData);
            // Re-group all data
            setSessionSummaries(groupBySession(combinedData));
          }

          setCreditsPage(page);
          setCreditsTotalRecords(result.data.pagination.total);
          setCreditsHasMore(result.data.pagination.hasMore);
          setCreditsUsageLoaded(true);

          // Use properly aggregated stats from the server
          setCreditsAggregatedStats({
            totalTokens: result.data.stats.totalTokens,
            totalCost: result.data.stats.totalCost,
            totalBillableUnits: result.data.stats.totalBillableUnits || 0,
            recordCount: result.data.stats.recordCount
          });
        }
      } else {
        const creditsUsageResult = await withTimeout(
          getUserTokenUsage(userId, dateRange.start, dateRange.end),
          10000
        );
        if (creditsUsageResult.data) {
          const transformedCreditsUsage = creditsUsageResult.data.map((usage: any) => ({
              id: usage.id,
              user_id: usage.user_id,
              user_email: currentUser?.email || '',
              user_name: currentUser?.email || '',
              operation_type: usage.operation_type,
              model: usage.model,
              tokens_used: usage.tokens_used,
              cost_usd: usage.cost_usd,
              billable_units: usage.billable_units || 0,
              billing_rule_name: usage.billing_rule_name || null,
              pricing_tier: usage.pricing_tier || null,
              created_at: usage.created_at,
              session_name: usage.session_name || null,
              session_id: usage.session_id || null
            }));
          setCreditsUsage(transformedCreditsUsage);
          setSessionSummaries(groupBySession(transformedCreditsUsage));
          setCreditsUsageLoaded(true);

          const totalTokens = transformedCreditsUsage.reduce((sum: number, u: any) => sum + u.tokens_used, 0);
          const totalCost = transformedCreditsUsage.reduce((sum: number, u: any) => sum + u.cost_usd, 0);
          const totalBillableUnits = transformedCreditsUsage.reduce((sum: number, u: any) => sum + (u.billable_units || 0), 0);
          setCreditsAggregatedStats({
            totalTokens,
            totalCost,
            totalBillableUnits,
            recordCount: transformedCreditsUsage.length
          });
        }
      }
    } catch (error) {
      console.error('Error loading credits usage:', error);
      toast.error('Failed to load credits usage data');
    } finally {
      setLoadingCreditsUsage(false);
      endTrace(traceId);
    }
  }, [userId, isAdmin, dateRange, selectedUserFilter, creditsPageSize, fetchFilteredUserCreditsAllowed]);

  // Set active tab from URL parameter
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['sessions', 'templates', 'savedOutputs', 'creditsUsage'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams, location.pathname]);

  // Persist activeTab to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('copyZap_dashboardTab', activeTab);
    localStorage.setItem('lastVisitedPage', '/dashboard');
  }, [activeTab]);

  // Load credits usage when Credits Usage tab is activated
  useEffect(() => {
    if (activeTab === 'creditsUsage' && !creditsUsageLoaded && !loadingCreditsUsage) {
      loadCreditsUsage(0, true);
    }
  }, [activeTab, creditsUsageLoaded, loadingCreditsUsage, loadCreditsUsage]);

  // Auto-reload credits usage when date range changes (only if tab is active and data has been loaded)
  useEffect(() => {
    if (activeTab === 'creditsUsage' && creditsUsageLoaded && !loadingCreditsUsage) {
      console.log('📅 Date range changed, auto-reloading credits usage...');
      setCreditsUsageLoaded(false);
      setCreditsPage(0);
      // Clear old stats immediately to avoid showing stale data
      setCreditsAggregatedStats({
        totalTokens: 0,
        totalCost: 0,
        totalBillableUnits: 0,
        recordCount: 0
      });
      // Small delay to ensure state updates are processed
      setTimeout(() => loadCreditsUsage(0, true), 0);
    }
  }, [dateRange.start, dateRange.end]); // Only watch date range changes

  // Handle delete copy session
  const handleDeleteSession = useCallback(async (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        if (!SUPABASE_ENABLED) {
          setCopySessions(copySessions.filter(session => session.id !== sessionId));
          toast.success('Session deleted successfully');
          return;
        }
        
        await deleteCopySession(sessionId);
        setCopySessions(copySessions.filter(session => session.id !== sessionId));
        toast.success('Session deleted successfully');
      } catch (error) {
        console.error('Error deleting session:', error);
        toast.error('Failed to delete session');
      }
    } 
  }, [SUPABASE_ENABLED, copySessions]);

  // Handle delete template
  const handleDeleteTemplate = useCallback(async (templateId: string) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        if (!SUPABASE_ENABLED) {
          setTemplates(templates.filter(template => template.id !== templateId));
          toast.success('Template deleted successfully');
          return;
        }
        
        await deleteTemplate(templateId);
        setTemplates(templates.filter(template => template.id !== templateId));
        toast.success('Template deleted successfully');
      } catch (error) {
        console.error('Error deleting template:', error);
        toast.error('Failed to delete template');
      }
    } 
  }, [SUPABASE_ENABLED, templates]);

  // Handle delete saved output
  const handleDeleteSavedOutput = useCallback(async (outputId: string) => {
    if (window.confirm('Are you sure you want to delete this saved output?')) {
      try {
        if (!SUPABASE_ENABLED) {
          setSavedOutputs(savedOutputs.filter(output => output.id !== outputId));
          toast.success('Saved output deleted successfully');
          return;
        }

        await deleteSavedOutput(outputId);
        setSavedOutputs(savedOutputs.filter(output => output.id !== outputId));
        toast.success('Saved output deleted successfully');
      } catch (error) {
        console.error('Error deleting saved output:', error);
        toast.error('Failed to delete saved output');
      }
    }
  }, [SUPABASE_ENABLED, savedOutputs]);

  // Filter saved outputs by search text
  // NOTE: Only searches metadata fields (title, description, tags) since we use SavedOutputMeta
  // input_data/output_data are NOT loaded in list view for performance
  const filterSavedOutputsBySearch = useCallback((outputs: SavedOutputMeta[]) => {
    if (!savedOutputsSearchText.trim()) {
      return outputs;
    }

    const searchLower = savedOutputsSearchText.toLowerCase();

    return outputs.filter(output => {
      // Search in title (always present)
      if (output.title.toLowerCase().includes(searchLower)) return true;

      // Search in description (optional)
      if (output.description?.toLowerCase().includes(searchLower)) return true;

      // Search in tags (array of strings)
      if (output.tags && output.tags.length > 0) {
        if (output.tags.some(tag => tag.toLowerCase().includes(searchLower))) return true;
      }

      return false;
    });
  }, [savedOutputsSearchText]);

  // Handle toggle favorite on saved output
  const handleToggleFavorite = useCallback(async (outputId: string, currentFavoriteStatus: boolean) => {
    try {
      if (!SUPABASE_ENABLED) {
        setSavedOutputs(savedOutputs.map(output =>
          output.id === outputId
            ? { ...output, is_favorite: !currentFavoriteStatus }
            : output
        ));
        toast.success(currentFavoriteStatus ? 'Removed from favorites' : 'Added to favorites');
        return;
      }

      const newFavoriteStatus = !currentFavoriteStatus;
      await toggleSavedOutputFavorite(outputId, newFavoriteStatus);
      setSavedOutputs(savedOutputs.map(output =>
        output.id === outputId
          ? { ...output, is_favorite: newFavoriteStatus }
          : output
      ));
      toast.success(newFavoriteStatus ? 'Added to favorites' : 'Removed from favorites');
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorite status');
    }
  }, [SUPABASE_ENABLED, savedOutputs]);

  // Helper function to determine route based on output tags
  const getOutputRoute = useCallback((output: SavedOutputMeta, paramType: 'sessionId' | 'savedOutputId') => {
    const tags = output.tags || [];
    const id = output.id;

    // Check for quick-polish
    if (tags.includes('quick-polish')) {
      return `/quick-polish?${paramType}=${id}`;
    }

    // Check for copy-snap modes
    if (tags.includes('improve') || tags.includes('answer') || tags.includes('question')) {
      return `/copy-snap?${paramType}=${id}`;
    }

    // Default to copy-maker
    return `/copy-maker?${paramType}=${id}`;
  }, []);

  // Helper function to determine route for copy sessions
  const getSessionRoute = useCallback((session: CopySession) => {
    // Check scope_key first (most reliable)
    if (session.scope_key === 'quick-polish') {
      return `/quick-polish?sessionId=${session.id}`;
    }
    if (session.scope_key === 'copy-snap') {
      return `/copy-snap?sessionId=${session.id}`;
    }

    // Fall back to output_type check (for older sessions)
    if (session.output_type === 'copy-snap') {
      return `/copy-snap?sessionId=${session.id}`;
    }

    // Default to copy-maker
    return `/copy-maker?sessionId=${session.id}`;
  }, []);

  // Handle template rename
  const handleStartRename = useCallback((template: Template) => {
    setEditingTemplateId(template.id || '');
    setEditingTemplateName(template.template_name);
  }, []);

  const handleCancelRename = useCallback(() => {
    setEditingTemplateId(null);
    setEditingTemplateName('');
  }, []);

  const handleSaveRename = useCallback(async (templateId: string) => {
    if (!editingTemplateName.trim()) {
      toast.error('Template name cannot be empty');
      return;
    }

    try {
      if (!SUPABASE_ENABLED) {
        // Update mock data
        setTemplates(templates.map(template => 
          template.id === templateId
            ? { ...template, template_name: editingTemplateName }
            : template
        ));
        toast.success('Template renamed successfully');
        setEditingTemplateId(null);
        setEditingTemplateName('');
        return;
      }
      
      await renameTemplate(templateId, editingTemplateName);
      setTemplates(templates.map(template => 
        template.id === templateId 
          ? { ...template, template_name: editingTemplateName }
          : template
      ));
      toast.success('Template renamed successfully');
      setEditingTemplateId(null);
      setEditingTemplateName('');
    } catch (error) {
      console.error('Error renaming template:', error);
      toast.error('Failed to rename template');
    }
  }, [SUPABASE_ENABLED, editingTemplateName, templates]);

  // Helper function to render tab navigation
  const renderTabNavigation = () => {
    const tabs = [
      { id: 'sessions', label: 'Copy Sessions', icon: FileText, count: stats.totalSessions },
      { id: 'templates', label: 'Templates', icon: Settings, count: stats.totalTemplates },
      { id: 'savedOutputs', label: 'Saved Outputs', icon: BarChart3, count: stats.totalSavedOutputs },
      { id: 'creditsUsage', label: 'Credits Usage', icon: DollarSign, count: null }
    ];

    return (
      <div className="border-b border-gray-300 dark:border-gray-800 mb-6">
        <nav className="flex space-x-8">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === id
                  ? 'border-gray-500 text-gray-600 dark:text-gray-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <Icon size={18} className="mr-2" />
              {label}
              {count !== null && <span className="ml-1">({count})</span>}
            </button>
          ))}
        </nav>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-700 dark:text-gray-300 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black text-black dark:text-white flex">
      <NavSidebar />
      <div className="flex-1 min-w-0">
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        <div className="mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Manage your copy sessions, templates, and view analytics
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={loadUserData}
              className="bg-gray-600 hover:bg-white0 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors shadow-md hover:shadow-lg"
              disabled={loading}
              title="Refresh data"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>

            {/* User Controls */}
            <Link
              to="/manage-workflows"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors shadow-md hover:shadow-lg"
              title="Manage Workflows"
            >
              <Workflow size={16} className="mr-2" />
              <span className="hidden sm:inline">Workflows</span>
            </Link>

            {/* Admin Controls */}
            {isAdmin && (
              <div className="flex items-center space-x-3">
                <Link
                  to="/manage-customers"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors shadow-md hover:shadow-lg"
                  title="Manage Customers"
                >
                  <Users size={16} className="mr-2" />
                  <span className="hidden sm:inline">Customers</span>
                </Link>

                <Link
                  to="/manage-users"
                  className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors shadow-md hover:shadow-lg"
                  title="Manage Users"
                >
                  <Users size={16} />
                </Link>

                <Link
                  to="/manage-special-instructions"
                  className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors shadow-md hover:shadow-lg"
                  title="Manage Special Instructions"
                >
                  <Lightbulb size={16} />
                </Link>

                <button
                  onClick={() => {
                    console.log('Blog button clicked, navigating to /admin/blog');
                    navigate('/admin/blog');
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors shadow-md hover:shadow-lg"
                  title="Manage Blog Posts"
                >
                  <BookOpen size={16} />
                </button>

                {/* Beta Registrations Count */}
                {betaRegistrationsCount !== null && (
                  <div className="bg-gray-600 text-white px-3 py-2 rounded-lg text-sm flex items-center shadow-md" title={`Beta Registrations: ${betaRegistrationsCount}`}>
                    <User size={16} className="mr-1" />
                    {betaRegistrationsCount}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Subscription Status */}
        {subscriptionData && (
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Calendar size={24} className="text-gray-500 mr-3" />
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Subscription Status</h2>
                    {subscriptionData.credit_plans && (
                      <span className="px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-sm font-medium rounded-full">
                        {subscriptionData.credit_plans.plan_name}
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {subscriptionData.start_date && subscriptionData.until_date
                      ? `Active from ${formatDate(subscriptionData.start_date)} to ${formatDate(subscriptionData.until_date)}`
                      : 'No subscription dates set'
                    }
                  </p>
                </div>
              </div>
              <div className="text-right flex items-center space-x-8">
                <div>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {stats.totalBillableUnits.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Credits Used</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Monthly Credits Balance (Phase 2A - Display Only) */}
        {creditsBalance && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-indigo-950 border border-blue-200 dark:border-indigo-800 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity size={24} className="text-blue-600 dark:text-blue-400 mr-3" />
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Monthly Credits Balance</h2>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {creditsBalance.creditsAllowed > 0
                      ? `Billing period: ${new Date(creditsBalance.periodStart).toLocaleDateString()} - ${new Date(creditsBalance.periodEnd).toLocaleDateString()}`
                      : 'Credits tracking active'}
                  </p>
                </div>
              </div>

              {creditsBalance.creditsAllowed > 0 ? (
                <div className="flex items-center space-x-8">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {creditsBalance.creditsAllowed.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Credits Allowed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {creditsBalance.creditsUsed.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Credits Used</div>
                  </div>
                  {isAdmin && creditsBalance.totalApiCostUsd !== undefined && (
                    <div>
                      <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                        {formatCostUSD(creditsBalance.totalApiCostUsd)}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">Cost USD</div>
                    </div>
                  )}
                  <div>
                    <div className={`text-2xl font-bold ${
                      creditsBalance.creditsRemaining > creditsBalance.creditsAllowed * 0.2
                        ? 'text-green-600 dark:text-green-400'
                        : creditsBalance.creditsRemaining > 0
                        ? 'text-yellow-600 dark:text-yellow-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {creditsBalance.creditsRemaining.toLocaleString()}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Credits Remaining</div>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-500 bg-blue-100 dark:bg-blue-50 dark:bg-opacity-10 px-3 py-2 rounded-lg">
                    <div className="font-semibold mb-1">
                      Next renewal: {new Date(creditsBalance.periodEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    {creditsBalance.note && <div className="italic">{creditsBalance.note}</div>}
                  </div>
                </div>
              ) : (
                <div className="text-center bg-gray-100 dark:bg-gray-800 px-6 py-4 rounded-lg">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    No credit plan assigned yet
                  </div>
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {creditsBalance.creditsUsed.toLocaleString()} credits used this period
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        {renderTabNavigation()}

        {/* Content based on active tab */}
        {activeTab === 'sessions' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-300 dark:border-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Copy Sessions</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Your saved copy generation sessions</p>
            </div>
            
            {copySessions.length === 0 ? (
              <div className="p-8 text-center"> {/* Removed token usage related content */}
                <FileText size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No sessions yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Create your first copy session by using the Copy Maker
                </p>
                <Link
                  to="/copy-maker"
                  className="bg-gray-600 hover:bg-white0 text-white px-4 py-2 rounded-lg inline-flex items-center"
                >
                  <Zap size={16} className="mr-2" />
                  Create Copy
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto"> {/* Removed token usage related content */}
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-white dark:bg-gray-800">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {copySessions.map((session) => (
                      <tr key={session.id} className="hover:bg-white dark:hover:bg-gray-800">
                        <td className="px-2 py-1">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {session.session_name || session.input_data?.projectDescription || session.brief_description || 'Untitled Session'}
                          </div>
                          {session.input_data && (session.input_data.language || session.input_data.tone || session.input_data.wordCount) && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {[session.input_data.language, session.input_data.tone, session.input_data.wordCount].filter(Boolean).join(' • ')}
                            </div>
                          )}
                          {session.input_data?.model && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              Model: {session.input_data.model}
                            </div>
                          )}
                        </td>
                        <td className="px-2 py-1 text-sm text-gray-900 dark:text-white">
                          {session.customer?.name || 'No customer'}
                        </td>
                        <td className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
                          <div>{session.output_type || session.input_data?.tab || 'Copy'}</div>
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {session.input_data?.pageType} • {session.input_data?.section}
                          </div>
                        </td>
                        <td className="px-2 py-1 text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(session.created_at)}
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(session.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </td>
                        <td className="px-2 py-1 text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={getSessionRoute(session)}
                              className="text-gray-600 hover:text-gray-500 p-2 rounded-md hover:bg-white dark:hover:bg-gray-900/20 transition-colors"
                              title="Load session"
                            >
                              <Eye size={16} />
                            </Link>
                            <button
                              onClick={() => handleDeleteSession(session.id)}
                              className="text-gray-600 hover:text-gray-500 p-2 rounded-md hover:bg-white dark:hover:bg-gray-900/20 transition-colors"
                              title="Delete session"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {hasMoreSessions && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
                    <button
                      onClick={loadMoreSessions}
                      disabled={loadingMoreSessions}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingMoreSessions ? 'Loading...' : 'Load More Sessions'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-300 dark:border-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Templates</h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">Your saved configuration templates</p>
            </div>
            
            {templates.length === 0 ? (
              <div className="p-8 text-center">
                <Settings size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No templates yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Save your first template by configuring a form and clicking "Save as Template"
                </p>
                <Link
                  to="/copy-maker"
                  className="bg-gray-600 hover:bg-white0 text-white px-4 py-2 rounded-lg inline-flex items-center"
                >
                  <Settings size={16} className="mr-2" />
                  Create Template
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-white dark:bg-gray-800">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Template Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Configuration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Content Settings</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {templates.map((template) => (
                      <tr key={template.id} className="hover:bg-white dark:hover:bg-gray-800">
                        <td className="px-4 py-2">
                          {editingTemplateId === template.id ? (
                            <div className="flex items-center space-x-2">
                              <input
                                type="text"
                                value={editingTemplateName}
                                onChange={(e) => setEditingTemplateName(e.target.value)}
                                className="text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded px-2 py-1"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveRename(template.id || '');
                                  if (e.key === 'Escape') handleCancelRename();
                                }}
                                autoFocus
                              />
                              <button
                                onClick={() => handleSaveRename(template.id || '')}
                                className="text-gray-600 hover:text-gray-500"
                                title="Save"
                              >
                                ✓
                              </button>
                              <button
                                onClick={handleCancelRename}
                                className="text-gray-600 hover:text-gray-500"
                                title="Cancel"
                              >
                                ✕
                              </button>
                            </div>
                          ) : (
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {template.template_name}
                                {template.is_public && (
                                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300">
                                    Public
                                  </span>
                                )}
                              </div>
                              {template.description && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {template.description}
                                </div>
                              )}
                              {template.creator && template.creator.email !== currentUser?.email && (
                                <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                  By: {template.creator.name || template.creator.email}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          <div className="space-y-1">
                            <div><span className="font-medium">Type:</span> <span className="capitalize">{template.template_type}</span></div>
                            <div><span className="font-medium">Language:</span> {template.language}</div>
                            <div><span className="font-medium">Tone:</span> {template.tone}</div>
                            <div><span className="font-medium">Word Count:</span> {template.word_count}{template.custom_word_count ? ` (${template.custom_word_count})` : ''}</div>
                            {template.page_type && <div><span className="font-medium">Page:</span> {template.page_type}</div>}
                            {template.section && <div><span className="font-medium">Section:</span> {template.section}</div>}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          <div className="space-y-1">
                            {template.target_audience && (
                              <div><span className="font-medium">Audience:</span> {
                                Array.isArray(template.target_audience)
                                  ? (() => {
                                      const joined = template.target_audience.join(', ');
                                      return joined.substring(0, 50) + (joined.length > 50 ? '...' : '');
                                    })()
                                  : template.target_audience.substring(0, 50) + (template.target_audience.length > 50 ? '...' : '')
                              }</div>
                            )}
                            {template.key_message && (
                              <div><span className="font-medium">Key Message:</span> {template.key_message.substring(0, 50)}{template.key_message.length > 50 ? '...' : ''}</div>
                            )}
                            {template.keywords && (
                              <div><span className="font-medium">Keywords:</span> {
                                Array.isArray(template.keywords)
                                  ? (() => {
                                      const joined = template.keywords.join(', ');
                                      return joined.substring(0, 40) + (joined.length > 40 ? '...' : '');
                                    })()
                                  : template.keywords.substring(0, 40) + (template.keywords.length > 40 ? '...' : '')
                              }</div>
                            )}
                            {template.selectedPersona && (
                              <div><span className="font-medium">Voice:</span> {template.selectedPersona}</div>
                            )}
                            {(template.generateScores || template.generateSeoMetadata) && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {[
                                  template.generateScores && 'Scoring',
                                  template.generateSeoMetadata && 'SEO Metadata'
                                ].filter(Boolean).join(' • ')}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          {template.created_at ? formatDate(template.created_at) : 'Unknown'}
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {template.created_at && new Date(template.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={`/copy-maker?templateId=${template.id}`}
                              className="text-gray-600 hover:text-gray-500 p-2 rounded-md hover:bg-white dark:hover:bg-gray-900/20 transition-colors"
                              title="Load template"
                            >
                              <Eye size={16} />
                            </Link>
                            {template.user_id === userId && (
                              <>
                                <button
                                  onClick={() => handleStartRename(template)}
                                  className="text-gray-600 hover:text-gray-500 p-2 rounded-md hover:bg-white dark:hover:bg-gray-900/20 transition-colors"
                                  title="Rename template"
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  onClick={() => handleDeleteTemplate(template.id || '')}
                                  className="text-gray-600 hover:text-gray-500 p-2 rounded-md hover:bg-white dark:hover:bg-gray-900/20 transition-colors"
                                  title="Delete template"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {hasMoreTemplates && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
                    <button
                      onClick={loadMoreTemplates}
                      disabled={loadingMoreTemplates}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingMoreTemplates ? 'Loading...' : 'Load More Templates'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'savedOutputs' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg">
            <div className="p-6 border-b border-gray-300 dark:border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Saved Outputs</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">Your specifically saved content outputs</p>
                </div>

                {/* Filter Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setSavedOutputsFilter('all')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      savedOutputsFilter === 'all'
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    All ({savedOutputs.length})
                  </button>
                  <button
                    onClick={() => setSavedOutputsFilter('favorites')}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center ${
                      savedOutputsFilter === 'favorites'
                        ? 'bg-gray-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Star size={16} className="mr-1" fill={savedOutputsFilter === 'favorites' ? 'currentColor' : 'none'} />
                    Favorites ({savedOutputs.filter(o => o.is_favorite).length})
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  value={savedOutputsSearchText}
                  onChange={(e) => setSavedOutputsSearchText(e.target.value)}
                  placeholder="Search saved outputs by title, description, tags, keywords..."
                  className="w-full pl-10 pr-10 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
                {savedOutputsSearchText && (
                  <button
                    onClick={() => setSavedOutputsSearchText('')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>
            </div>
            
            {savedOutputs.length === 0 ? (
              <div className="p-8 text-center">
                <BarChart3 size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No saved outputs yet</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Save your first output by generating copy and clicking "Save Output"
                </p>
                <Link
                  to="/copy-maker"
                  className="bg-gray-600 hover:bg-white0 text-white px-4 py-2 rounded-lg inline-flex items-center"
                >
                  <Zap size={16} className="mr-2" />
                  Generate Copy
                </Link>
              </div>
            ) : (() => {
                const searchFiltered = filterSavedOutputsBySearch(savedOutputs);
                const finalFiltered = searchFiltered.filter(output => savedOutputsFilter === 'all' || output.is_favorite);

                if (finalFiltered.length === 0) {
                  return (
                    <div className="p-8 text-center">
                      {savedOutputsSearchText ? (
                        <>
                          <Search size={48} className="text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No matching outputs</h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            No saved outputs match your search "{savedOutputsSearchText}"
                          </p>
                          <button
                            onClick={() => setSavedOutputsSearchText('')}
                            className="bg-gray-600 hover:bg-white0 text-white px-4 py-2 rounded-lg inline-flex items-center"
                          >
                            Clear Search
                          </button>
                        </>
                      ) : savedOutputsFilter === 'favorites' ? (
                        <>
                          <Star size={48} className="text-gray-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No favorites yet</h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Star your favorite outputs to see them here
                          </p>
                          <button
                            onClick={() => setSavedOutputsFilter('all')}
                            className="bg-gray-600 hover:bg-white0 text-white px-4 py-2 rounded-lg inline-flex items-center"
                          >
                            View All Outputs
                          </button>
                        </>
                      ) : null}
                    </div>
                  );
                }

                const latestTimestamp = finalFiltered.reduce((max, o) => {
                  const t = o.created_at ? new Date(o.created_at).getTime() : 0;
                  return t > max ? t : max;
                }, 0);
                const latestBatchIds = new Set(
                  finalFiltered
                    .filter(o => o.created_at && latestTimestamp - new Date(o.created_at).getTime() <= 30000)
                    .map(o => o.id)
                );

                return (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-white dark:bg-gray-800">
                    <tr>
                      <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                        <Star size={16} className="mx-auto" />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Configuration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Content Details</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Saved</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {finalFiltered.map((output) => (
                      <tr key={output.id} className={`${latestBatchIds.has(output.id) ? 'bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30' : 'hover:bg-white dark:hover:bg-gray-800'}`}>
                        <td className="px-2 py-2 text-center">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(output.id || '', output.is_favorite || false);
                            }}
                            className="text-gray-400 hover:text-yellow-500 transition-colors p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                            title={output.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Star
                              size={20}
                              fill={output.is_favorite ? 'currentColor' : 'none'}
                              className={output.is_favorite ? 'text-yellow-500' : ''}
                            />
                          </button>
                        </td>
                        <td className="px-4 py-2">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {output.title || output.name}
                          </div>
                          {output.description && (
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {output.description}
                            </div>
                          )}
                          {output.tags && output.tags.length > 0 && (
                            <div className="flex gap-1 mt-1">
                              {output.tags.map((tag, i) => (
                                <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          <div className="space-y-1">
                            {output.feature && (
                              <div><span className="font-medium">Feature:</span> {output.feature}</div>
                            )}
                            {output.operation && (
                              <div><span className="font-medium">Operation:</span> {output.operation}</div>
                            )}
                            {output.output_type && (
                              <div><span className="font-medium">Type:</span> {output.output_type}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                            Open to view details
                          </div>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
                          {output.created_at ? formatDate(output.created_at) : 'Unknown'}
                          <div className="text-xs text-gray-400 dark:text-gray-500">
                            {output.created_at && new Date(output.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <Link
                              to={getOutputRoute(output, 'savedOutputId')}
                              className="text-gray-600 hover:text-gray-500 p-2 rounded-md hover:bg-white dark:hover:bg-gray-900/20 transition-colors"
                              title="Load saved output"
                            >
                              <Eye size={16} />
                            </Link>
                            <button
                              onClick={() => handleDeleteSavedOutput(output.id || '')}
                              className="text-gray-600 hover:text-gray-500 p-2 rounded-md hover:bg-white dark:hover:bg-gray-900/20 transition-colors"
                              title="Delete saved output"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {hasMoreOutputs && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-center">
                    <button
                      onClick={loadMoreOutputs}
                      disabled={loadingMoreOutputs}
                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingMoreOutputs ? 'Loading...' : 'Load More Outputs'}
                    </button>
                  </div>
                )}
              </div>
                );
              })()}
          </div>
        )}

        {activeTab === 'creditsUsage' && (
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 rounded-lg">
            {loadingCreditsUsage ? (
              <div className="p-12 flex flex-col items-center justify-center">
                <LoadingSpinner />
                <p className="text-gray-600 dark:text-gray-400 mt-4">Loading credits usage data...</p>
              </div>
            ) : (
              <>
            <div className="p-6 border-b border-gray-300 dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Credits Usage</h2>
                  <p className="text-gray-600 dark:text-gray-400 mt-1">
                    {isAdmin ? 'Monitor API credit consumption across all users' : 'Monitor your API credit consumption'}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={exportCreditsUsageToCSV}
                    disabled={creditsUsage.length === 0}
                    className="bg-gray-600 hover:bg-white0 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Export current page data to CSV"
                  >
                    <Download size={16} className="mr-2" />
                    Export CSV
                  </button>
                </div>
              </div>
              
              {/* Date Range Filter */}
              <div className="mt-4 flex flex-col space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 sm:space-x-4">
                  <div className="flex items-center space-x-3">
                    <Calendar size={16} className="text-gray-500" />
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Date Range:
                    </label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                    />
                    <span className="text-gray-500">to</span>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                    />
                    <button
                      onClick={() => {
                        setCreditsUsageLoaded(false);
                        setCreditsPage(0);
                        // Clear old stats immediately to avoid showing stale data
                        setCreditsAggregatedStats({
                          totalTokens: 0,
                          totalCost: 0,
                          totalBillableUnits: 0,
                          recordCount: 0
                        });
                        loadCreditsUsage(0, true);
                      }}
                      className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors"
                    >
                      <RefreshCw size={16} className="mr-2" />
                      Apply
                    </button>
                  </div>
                </div>

                {/* User Filter and Stats - Only show for admin */}
                {isAdmin && (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center">
                        <Filter size={16} className="text-gray-500 mr-2" />
                        <label htmlFor="userFilter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Filter by user:
                        </label>
                      </div>
                      <select
                        id="userFilter"
                        value={selectedUserFilter}
                        onChange={(e) => {
                          setSelectedUserFilter(e.target.value);
                          setCreditsUsageLoaded(false);
                          setCreditsPage(0);
                          // Clear old stats immediately to avoid showing stale data
                          setCreditsAggregatedStats({
                            totalTokens: 0,
                            totalCost: 0,
                            totalBillableUnits: 0,
                            recordCount: 0
                          });
                          setTimeout(() => loadCreditsUsage(0, true), 0);
                        }}
                        className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-gray-100 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 px-3 py-2"
                      >
                        <option value="all">All Users</option>
                        {allUsers.map(user => (
                          <option key={user.email} value={user.id}>
                            {user.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center space-x-4 text-sm">
                      <div className="bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Total: {creditsAggregatedStats.recordCount.toLocaleString()} records
                        </span>
                      </div>
                      {isAdmin && selectedUserFilter !== 'all' && filteredUserCreditsAllowed !== null && filteredUserCreditsAllowed !== undefined && (
                        <div className="bg-blue-100 dark:bg-blue-900 px-3 py-2 rounded-lg">
                          <span className="font-medium text-blue-700 dark:text-blue-300">
                            Credits Allowed: {filteredUserCreditsAllowed.toLocaleString()}
                          </span>
                        </div>
                      )}
                      <div className="bg-indigo-100 dark:bg-indigo-900 px-3 py-2 rounded-lg">
                        <span className="font-medium text-indigo-700 dark:text-indigo-300">
                          Credits used: {creditsAggregatedStats.totalBillableUnits.toLocaleString()}
                        </span>
                      </div>
                      {isAdmin && (
                        <div className="bg-purple-100 dark:bg-purple-900 px-3 py-2 rounded-lg">
                          <span className="font-medium text-purple-700 dark:text-purple-300">
                            Cost USD: {formatCostUSD(creditsAggregatedStats.totalCost)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {sessionSummaries.size === 0 ? (
              <div className="p-8 text-center">
                <DollarSign size={48} className="text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No credits usage data</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {isAdmin ? 'Credits usage will appear here as users generate content' : 'Your credits usage will appear here as you generate content'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-white dark:bg-gray-800">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-8"></th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Session Name</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">API Calls</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-indigo-500 dark:text-indigo-400 uppercase tracking-wider">Credits</th>
                      {isAdmin && (
                        <th className="px-4 py-3 text-right text-xs font-medium text-purple-500 dark:text-purple-400 uppercase tracking-wider">Cost USD</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                    {Array.from(sessionSummaries.values()).map((session) => (
                      <React.Fragment key={session.session_id}>
                        <tr
                          className="hover:bg-white dark:hover:bg-gray-800 cursor-pointer"
                          onClick={() => setExpandedSessionId(expandedSessionId === session.session_id ? null : session.session_id)}
                        >
                          <td className="px-4 py-3">
                            {expandedSessionId === session.session_id ? (
                              <ChevronDown size={16} className="text-gray-500" />
                            ) : (
                              <ChevronRight size={16} className="text-gray-500" />
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {session.session_name}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {session.api_calls}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                              {(session.total_billable_units || 0).toLocaleString()}
                            </div>
                          </td>
                          {isAdmin && (
                            <td className="px-4 py-3 text-right">
                              <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                                {formatCostUSD(session.total_cost || 0)}
                              </div>
                            </td>
                          )}
                        </tr>
                        {expandedSessionId === session.session_id && (
                          <tr>
                            <td colSpan={6} className="px-0 py-0">
                              <div className="bg-white dark:bg-gray-800/50">
                                <table className="min-w-full">
                                  <thead className="bg-gray-100 dark:bg-gray-800">
                                    <tr>
                                      <th className="px-8 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Operation</th>
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Model</th>
                                      <th className="px-4 py-2 text-right text-xs font-medium text-indigo-500 dark:text-indigo-400">Credits</th>
                                      {isAdmin && (
                                        <th className="px-4 py-2 text-right text-xs font-medium text-purple-500 dark:text-purple-400">Cost USD</th>
                                      )}
                                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                    {session.details.map((detail) => (
                                      <tr key={detail.id} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                                        <td className="px-8 py-2">
                                          <div className="text-sm text-gray-900 dark:text-white">
                                            {getOperationLabel(detail.operation_type)}
                                          </div>
                                        </td>
                                        <td className="px-4 py-2">
                                          <div className="text-sm text-gray-700 dark:text-gray-300">
                                            {detail.model}
                                          </div>
                                        </td>
                                        <td className="px-4 py-2 text-right">
                                          <div className="text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                                            {(detail.billable_units || 0).toLocaleString()}
                                          </div>
                                        </td>
                                        {isAdmin && (
                                          <td className="px-4 py-2 text-right">
                                            <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                                              {formatCostUSD(detail.cost_usd || 0)}
                                            </div>
                                          </td>
                                        )}
                                        <td className="px-4 py-2">
                                          <div className="text-sm text-gray-700 dark:text-gray-300">
                                            {formatDate(detail.created_at)}
                                          </div>
                                          <div className="text-xs text-gray-500 dark:text-gray-400">
                                            {new Date(detail.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>

                {/* Pagination Controls - Only for admin */}
                {isAdmin && creditsUsage.length > 0 && (
                  <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Showing {creditsUsage.length} of {creditsTotalRecords.toLocaleString()} records
                      {creditsHasMore && ' (load more to see all)'}
                    </div>
                    {creditsHasMore && (
                      <button
                        onClick={() => loadCreditsUsage(creditsPage + 1, false)}
                        disabled={loadingCreditsUsage}
                        className="bg-primary-600 hover:bg-primary-500 text-white px-4 py-2 rounded-lg text-sm flex items-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loadingCreditsUsage ? (
                          <>
                            <RefreshCw size={16} className="mr-2 animate-spin" />
                            Loading...
                          </>
                        ) : (
                          <>
                            Load More
                            <ArrowRight size={16} className="ml-2" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
            </>
            )}
          </div>
        )}

        <PublicFooter />
        </div>
      </div>
      </div>
    </div>
  );
};

export default Dashboard;