import { createClient } from '@supabase/supabase-js';
import { FormData, Customer, CopySession, Template, TokenUsage, StructuredCopyOutput, SavedOutput, FormState, AbsoluteScoreBreakdown } from '../types';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
});

// Export the Supabase client directly
export { supabase };

// Export function to get the Supabase client
export const getSupabaseClient = () => supabase;

// User authentication functions
export const signUp = async (email: string, password: string) => {
  return supabase.auth.signUp({ email, password });
};

export const signIn = async (email: string, password: string) => {
  return supabase.auth.signInWithPassword({ email, password });
};

export const signOut = async () => {
  return supabase.auth.signOut();
};

// Prefill interface for database-stored prefills
export interface Prefill {
  id: string;
  created_at: string;
  updated_at: string;
  label: string;
  category: string;
  data: any; // FormState data as JSONB
  is_public: boolean;
  user_id: string | null;
}

// Admin function to create a new user
export const adminCreateUser = async (userData: {
  email: string;
  password: string;
  name: string;
  startDate: string | null;
  untilDate: string | null;
  creditsAllowed: number;
}) => {
  try {
    console.log('Creating user via edge function:', userData.email);
    
    // Get current user's session token
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session?.access_token) {
      throw new Error('No active session found. Please log in and try again.');
    }
    
    // Call the secure edge function for admin user creation
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-create-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        name: userData.name,
        startDate: userData.startDate,
        untilDate: userData.untilDate,
        tokensAllowed: userData.creditsAllowed
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('User created successfully via edge function');
    
    return {
      user: result.user,
      error: null
    };
  } catch (error) {
    console.error('Error in adminCreateUser:', error);
    throw error;
  }
};

export const getCurrentUser = async () => {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  return data.user;
};

export const getSession = async () => {
  return supabase.auth.getSession();
};

// Function to get the current session token
export const getSessionToken = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session?.access_token) {
    throw new Error('No active session found. Please log in and try again.');
  }
  
  return session.access_token;
};

// Function to get a specific copy session by ID with abort support
export const getCopySession = async (sessionId: string, signal?: AbortSignal) => {
  // Create custom fetch function with abort signal
  if (signal) {
    const fetchWithAbort = async () => {
      // Check if already aborted
      if (signal.aborted) {
        throw new DOMException('Loading aborted by the user', 'AbortError');
      }
      
      return supabase
        .from('pmc_copy_sessions')
        .select('*, customer:customer_id(name)')
        .eq('id', sessionId)
        .single();
    };
    
    // Set up abort handler
    return new Promise((resolve, reject) => {
      // Create abort handler
      const abortHandler = () => {
        reject(new DOMException('Loading aborted by the user', 'AbortError'));
      };
      
      // Add abort listener
      signal.addEventListener('abort', abortHandler, { once: true });
      
      // Execute the fetch
      fetchWithAbort()
        .then(result => {
          signal.removeEventListener('abort', abortHandler);
          resolve(result);
        })
        .catch(error => {
          signal.removeEventListener('abort', abortHandler);
          reject(error);
        });
    });
  }
  
  // Fallback to normal execution without abort handling
  return supabase
    .from('pmc_copy_sessions')
    .select('*, customer:customer_id(name)')
    .eq('id', sessionId)
    .single();
};

// Function to get the latest copy session for a user with abort support
export const getLatestCopySession = async (userId: string, signal?: AbortSignal) => {
  // Create custom fetch function with abort signal
  if (signal) {
    const fetchWithAbort = async () => {
      // Check if already aborted
      if (signal.aborted) {
        throw new DOMException('Loading aborted by the user', 'AbortError');
      }
      
      return supabase
        .from('pmc_copy_sessions')
        .select('*, customer:customer_id(name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
    };
    
    // Set up abort handler
    return new Promise((resolve, reject) => {
      // Create abort handler
      const abortHandler = () => {
        reject(new DOMException('Loading aborted by the user', 'AbortError'));
      };
      
      // Add abort listener
      signal.addEventListener('abort', abortHandler, { once: true });
      
      // Execute the fetch
      fetchWithAbort()
        .then(result => {
          signal.removeEventListener('abort', abortHandler);
          resolve(result);
        })
        .catch(error => {
          signal.removeEventListener('abort', abortHandler);
          reject(error);
        });
    });
  }
  
  // Fallback to normal execution without abort handling
  return supabase
    .from('pmc_copy_sessions')
    .select('*, customer:customer_id(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
};

// Function to get a specific template by ID with abort support
export const getTemplate = async (templateId: string, signal?: AbortSignal) => {
  // Create custom fetch function with abort signal
  if (signal) {
    const fetchWithAbort = async () => {
      // Check if already aborted
      if (signal.aborted) {
        throw new DOMException('Loading aborted by the user', 'AbortError');
      }
      
      return supabase
        .from('pmc_templates')
        .select('*')
        .eq('id', templateId)
        .single();
    };
    
    // Set up abort handler
    return new Promise((resolve, reject) => {
      // Create abort handler
      const abortHandler = () => {
        reject(new DOMException('Loading aborted by the user', 'AbortError'));
      };
      
      // Add abort listener
      signal.addEventListener('abort', abortHandler, { once: true });
      
      // Execute the fetch
      fetchWithAbort()
        .then(result => {
          signal.removeEventListener('abort', abortHandler);
          resolve(result);
        })
        .catch(error => {
          signal.removeEventListener('abort', abortHandler);
          reject(error);
        });
    });
  }
  
  // Fallback to normal execution without abort handling
  return supabase
    .from('pmc_templates')
    .select('*')
    .eq('id', templateId)
    .single();
};

// Function to check if a user exists by email (works for unauthenticated users)
export const checkUserExists = async (email: string) => {
  try {
    const { data, error } = await supabase.rpc('public_check_user_exists', {
      user_email: email
    });

    if (error) {
      console.error('Error checking if user exists:', error);
      throw error;
    }

    return data === true;
  } catch (error) {
    console.error('Exception in checkUserExists:', error);
    throw error;
  }
};

// Function to create a new user in the pmc_users table
export const createNewUser = async (id: string, email: string, name: string) => {
  const { error } = await supabase
    .from('pmc_users')
    .insert([
      { 
        id, 
        email,
        name: name || email.split('@')[0]
      }
    ]);
  
  if (error) {
    console.error('Error creating new user:', error);
    throw error;
  }
  
  return true;
};

// Function to save token usage data
export const saveTokenUsage = async (
  user_email: string,
  token_usage: number,
  token_cost: number,
  control_executed: string,
  brief_description: string,
  model: string = 'gpt-4o',
  copy_source: string = 'Copy Generator',
  session_id?: string,
  project_description?: string
) => {
  // First, get the current authenticated user's email to ensure we're using 
  // the exact same format that Supabase has in the JWT token
  try {
    console.log("saveTokenUsage called with user_email:", user_email);
    const { data: { user } } = await supabase.auth.getUser();
    
    // Use the authenticated user's email if available, otherwise fall back to the provided email
    const emailToUse = user?.email || user_email;
    
    console.log('Saving token usage for user:', emailToUse);
    
    return supabase
      .from('pmc_user_tokens_usage')
      .insert([
        {
          user_email: emailToUse,
          token_usage,
          token_cost,
          control_executed,
          brief_description,
          model,
          copy_source,
          session_id,
          project_description
        }
      ]);
  } catch (error) {
    console.error('Error getting authenticated user in saveTokenUsage:', error);
    
    // Fall back to using the provided email
    return supabase
      .from('pmc_user_tokens_usage')
      .insert([
        {
          user_email: user_email,
          token_usage,
          token_cost,
          control_executed,
          brief_description,
          model,
          copy_source,
          session_id,
          project_description
        }
      ]);
  }
};

// Function to get user templates
export const getUserTemplates = async (
  userId?: string,
  limit: number = 100,
  cursor?: { created_at: string; id: string }
) => {
  if (!userId) {
    console.error('getUserTemplates called without userId');
    return { data: null, error: new Error('User ID is required') };
  }

  console.log('getUserTemplates called with userId:', userId, 'limit:', limit, 'cursor:', cursor);

  try {
    let query = supabase
      .from('pmc_templates')
      .select('*, creator:user_id(name, email)')
      .or(`user_id.eq.${userId},is_public.eq.true`);

    // Cursor-based pagination using composite key (created_at, id)
    // This prevents duplicates/gaps when multiple records have the same created_at
    if (cursor) {
      query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
    }

    const result = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit);

    console.log('getUserTemplates result:', {
      dataLength: result.data?.length || 0,
      error: result.error
    });

    if (result.error) {
      console.error('getUserTemplates Supabase error:', result.error);
    }

    return result;
  } catch (error) {
    console.error('getUserTemplates exception:', error);
    return { data: null, error };
  }
};

// Original implementation kept as backup
export const _getUserTemplates = async (userId?: string) => {
  if (!userId) {
    return { data: null, error: new Error('User ID is required') };
  }
  
  return supabase
    .from('pmc_templates')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
};

// Function to delete a template
export const deleteTemplate = async (templateId: string) => {
  return supabase
    .from('pmc_templates')
    .delete()
    .eq('id', templateId);
};

// Function to rename a template
export const renameTemplate = async (templateId: string, newName: string) => {
  return supabase
    .from('pmc_templates')
    .update({ template_name: newName })
    .eq('id', templateId);
};

// Function to save or update a template
export const saveTemplate = async (template: Template, existingTemplateId?: string) => {
  console.log('=== TEMPLATE SAVE DEBUG ===');
  console.log('Input template data:', template);
  console.log('is_public:', template.is_public);
  console.log('output_structure from input:', template.output_structure);
  
  // Create a copy of the template with snake_case properties for database columns
  const dbTemplate: any = {
    user_id: template.user_id,
    template_name: template.template_name,
    description: template.description,
    language: template.language,
    tone: template.tone,
    word_count: template.word_count,
    custom_word_count: template.custom_word_count,
    target_audience: template.target_audience,
    key_message: template.key_message,
    desired_emotion: template.desired_emotion,
    call_to_action: template.call_to_action,
    brand_values: template.brand_values,
    keywords: template.keywords,
    context: template.context,
    brief_description: template.brief_description,
    page_type: template.page_type,
    business_description: template.business_description,
    original_copy: template.original_copy,
    template_type: template.template_type,
    competitor_urls: template.competitor_urls,
    product_service_name: template.product_service_name,
    industry_niche: template.industry_niche,
    tone_level: template.tone_level,
    reader_funnel_stage: template.reader_funnel_stage,
    competitor_copy_text: template.competitor_copy_text,
    target_audience_pain_points: template.target_audience_pain_points,
    preferred_writing_style: template.preferred_writing_style,
    language_style_constraints: template.language_style_constraints,
    excluded_terms: template.excluded_terms,
    section: template.section,
    generate_seo_metadata: template.generateSeoMetadata || false,
    generatescores: template.generateScores || template.generatescores,
    generateHeadlines: template.generateHeadlines || false,
    selectedPersona: template.selectedPersona,
    numberOfHeadlines: template.numberOfHeadlines || 3,
    output_structure: Array.isArray(template.output_structure)
      ? template.output_structure.map((item: any) => {
          // If item has 'section' property, it's already in DB format
          if (item && typeof item === 'object' && 'section' in item) {
            return {
              section: item.section,
              wordCount: item.wordCount || null,
              description: item.description || undefined
            };
          }
          // If item has 'label' property, convert from form format to DB format
          if (item && typeof item === 'object' && 'label' in item) {
            return {
              section: item.label,
              wordCount: item.wordCount || null,
              description: item.description || undefined
            };
          }
          // If it's a string, convert to DB format
          if (typeof item === 'string') {
            return {
              section: item,
              wordCount: null,
              description: undefined
            };
          }
          // Fallback: return as-is
          return item;
        })
      : [],
    sectionBreakdown: template.sectionBreakdown || template.section_breakdown,
    forceElaborationsExamples: template.forceElaborationsExamples || template.force_elaborations_examples,
    prioritizeWordCount: template.prioritizeWordCount || false,
    adhereToLittleWordCount: template.adhereToLittleWordCount || false,
    littleWordCountTolerancePercentage: template.littleWordCountTolerancePercentage || 20,
    location: template.location,
    include_section_titles: template.includeSectionTitles !== undefined ? template.includeSectionTitles : true,
    project_description: template.project_description,
    is_public: Boolean(template.is_public),
    category: template.category,
    special_instructions: template.special_instructions,
    customer_id: template.customerId || null,
    brand_voice_id: template.brandVoiceId || null,
    // Optional feature toggles
    generate_scores: template.generateScores || false,
    generate_geo_score: template.generateGeoScore || false,
    force_elaborations_examples: template.forceElaborationsExamples || false,
    enhance_for_geo: template.enhanceForGEO || false,
    add_tldr_summary: template.addTldrSummary || false,
    geo_regions: template.geoRegions || null,
    num_url_slugs: template.numUrlSlugs || null,
    num_meta_descriptions: template.numMetaDescriptions || null,
    num_h1_variants: template.numH1Variants || null,
    num_h2_variants: template.numH2Variants || null,
    num_h3_variants: template.numH3Variants || null,
    num_og_titles: template.numOgTitles || null,
    num_og_descriptions: template.numOgDescriptions || null,
    word_count_tolerance_percentage: template.wordCountTolerancePercentage || null,
  };

  console.log('Final dbTemplate for database:', {
    is_public: dbTemplate.is_public,
    template_name: dbTemplate.template_name,
    output_structure: dbTemplate.output_structure,
    output_structure_length: dbTemplate.output_structure?.length || 0
  });

  if (existingTemplateId) {
    // Update existing template by ID
    console.log('🔄 Updating existing template with ID:', existingTemplateId);
    const { data, error } = await supabase
      .from('pmc_templates')
      .update(dbTemplate)
      .eq('id', existingTemplateId)
      .select();
    
    console.log('🔄 Update result:', { data, error });
    
    if (error) {
      console.error('❌ Database update error:', error);
      return { 
        error: new Error(`Failed to update template: ${error.message}`), 
        updated: false, 
        id: null 
      };
    }
    
    console.log('✅ Template updated successfully');
    return { error: null, updated: true, id: existingTemplateId };
  } else {
    // Check if a template with this name already exists for this user
    console.log('🔍 Checking for existing template with name:', template.template_name);
    const { data: existingTemplate, error: queryError } = await supabase
      .from('pmc_templates')
      .select('id')
      .eq('user_id', template.user_id)
      .eq('template_name', template.template_name)
      .maybeSingle();

    if (queryError) {
      console.error('Error checking for existing template:', queryError);
      return { error: queryError, updated: false, id: null };
    }

    if (existingTemplate) {
      // Update existing template
      console.log('🔄 Found existing template, updating ID:', existingTemplate.id);
      const { error } = await supabase
        .from('pmc_templates')
        .update(dbTemplate)
        .eq('id', existingTemplate.id);
      
      console.log('🔄 Existing template update result:', { error });
      
      if (error) {
        console.error('❌ Database update error for existing template:', error);
        return { 
          error: new Error(`Failed to update existing template: ${error.message}`), 
          updated: false, 
          id: null 
        };
      }
      
      console.log('✅ Existing template updated successfully');
      return { error: null, updated: true, id: existingTemplate.id };
    } else {
      // Insert new template
      console.log('➕ Inserting new template with data:', dbTemplate);
      const { data, error } = await supabase
        .from('pmc_templates')
        .insert([dbTemplate])
        .select();
      
      console.log('➕ Insert result:', { data, error });
      
      if (error) {
        console.error('❌ Database insert error:', error);
        return { 
          error: new Error(`Failed to insert new template: ${error.message}`), 
          updated: false, 
          id: null 
        };
      }
      
      if (!data || data.length === 0) {
        console.error('❌ No data returned from insert operation');
        return { 
          error: new Error('Template insert succeeded but no data was returned'), 
          updated: false, 
          id: null 
        };
      }
      
      console.log('✅ New template inserted successfully with ID:', data[0]?.id);
      return { error: null, updated: false, id: data[0]?.id };
    }
  }
};

// Ensure user exists in the pmc_users table
export const ensureUserExists = async (userId: string, email: string, name?: string) => {
  try {
    console.log('🔍 ensureUserExists: Starting for user:', email, 'ID:', userId);

    // Add timeout protection
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('ensureUserExists timeout after 10 seconds')), 10000);
    });

    // Check if user already exists in pmc_users
    console.log('🔍 ensureUserExists: Checking database for existing user...');
    const selectPromise = supabase
      .from('pmc_users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const { data: existingUser, error: selectError } = await Promise.race([
      selectPromise,
      timeoutPromise
    ]) as any;

    console.log('🔍 ensureUserExists: Database query completed');

    if (selectError) {
      console.error('❌ ensureUserExists: Error checking user existence:', selectError);
      throw selectError;
    }

    if (existingUser) {
      console.log('✅ ensureUserExists: User already exists in pmc_users');
      return {
        id: existingUser.id,
        email: existingUser.email,
        until_date: existingUser.until_date,
        tokens_remaining: 0,
        credits_allowed: existingUser.credits_allowed || 0
      };
    }

    // User doesn't exist, create them
    console.log('📝 ensureUserExists: User not found, creating new record...');
    const insertPromise = supabase
      .from('pmc_users')
      .insert([{
        id: userId,
        email: email,
        name: name || email.split('@')[0]
      }])
      .select()
      .single();

    const { data: newUser, error: insertError } = await Promise.race([
      insertPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Insert timeout after 10 seconds')), 10000))
    ]) as any;

    if (insertError) {
      console.error('❌ ensureUserExists: Error creating user:', insertError);
      throw insertError;
    }

    console.log('✅ ensureUserExists: User created successfully:', newUser.email);
    return {
      id: newUser.id,
      email: newUser.email,
      until_date: newUser.until_date,
      tokens_remaining: 0,
      credits_allowed: newUser.credits_allowed || 0
    };
  } catch (error: any) {
    console.error('❌ ensureUserExists: Critical error:', error?.message || error);
    console.error('❌ ensureUserExists: Full error object:', error);
    throw error;
  }
};

// Customer functions
export const getCustomers = async (userId?: string) => {
  if (userId) {
    return supabase
      .from('pmc_customers')
      .select('*')
      .eq('user_id', userId)
      .order('name');
  }
  
  // Fallback to all customers if no userId provided (for backwards compatibility)
  return supabase
    .from('pmc_customers')
    .select('*')
    .order('name');
};

// Updated to include user_id parameter
export const createCustomer = async (name: string, userId: string) => {
  return supabase
    .from('pmc_customers')
    .insert([
      { 
        name, 
        user_id: userId  // Include the user_id to satisfy RLS policy
      }
    ])
    .select()
    .single();
};

// Helper function to convert copy content for storage
const prepareCopyForStorage = (copy: string | StructuredCopyOutput) => {
  if (typeof copy === 'string') {
    return copy;
  }
  return copy; // Supabase JSONB will handle the JSON object
};

// Function to create a working session early (when Copy Maker mounts)
export const createWorkingSession = async (customerId?: string) => {
  try {
    // Get the current authenticated user
    const user = await getCurrentUser();

    if (!user || !user.id) {
      console.warn('No authenticated user found for creating working session');
      return null;
    }

    // Create a minimal session with a default name using sessionManager for consistency
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
    const dateStr = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
    const defaultSessionName = `Copy Generation - ${dateStr} ${timeStr}`;

    const result = await supabase
      .from('pmc_copy_sessions')
      .insert([
        {
          user_id: user.id,
          customer_id: customerId && customerId !== 'none' && customerId !== '' ? customerId : null,
          session_name: defaultSessionName,
          input_data: {}, // Empty input data initially
          output_type: null,
          brief_description: null // Will be set later during generation
        },
      ])
      .select()
      .single();

    if (result.error) {
      console.error('Error creating working session:', result.error);
      return null;
    }

    console.log('✅ Working session created:', result.data.id, 'with name:', defaultSessionName);
    return result.data;
  } catch (error) {
    console.error('Error in createWorkingSession:', error);
    return null;
  }
};

// Function to save a copy session
export const saveCopySession = async (data: FormData, improvedCopy: string | StructuredCopyOutput, alternativeCopy?: string | StructuredCopyOutput, sessionId?: string) => {
  try {
    // Get the current authenticated user
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      throw new Error('No authenticated user found. Please log in and try again.');
    }
    
    // Extract required fields from formData
    const {
      customerId,
      outputType,
      briefDescription,
      outputStructure
    } = data;

    // Create input_data object
    const inputData = {
      ...data,
      outputStructure: outputStructure || []
    };

    // If sessionId is provided, update the existing session
    if (sessionId) {
      console.log('Updating existing session:', sessionId);

      // Generate a proper session name based on the content
      let sessionName = 'Copy Generation Session';

      if (outputType) {
        sessionName = outputType;
      } else if (briefDescription) {
        sessionName = briefDescription.substring(0, 100);
      } else if (data.projectDescription) {
        sessionName = data.projectDescription.substring(0, 100);
      }

      // Create update object with all the fields that should be updated
      const updateData: any = {
        input_data: inputData,
        output_type: outputType || null,
        brief_description: briefDescription || null,
        session_name: sessionName,
        customer_id: customerId && customerId !== 'none' && customerId !== '' ? customerId : null
      };

      console.log('📝 Updating session with name:', sessionName);

      const updateResult = await supabase
        .from('pmc_copy_sessions')
        .update(updateData)
        .eq('id', sessionId)
        .eq('user_id', user.id) // Ensure user can only update their own sessions
        .select();
      
      // If no rows were updated (session doesn't exist), create a new session instead
      if (updateResult.data && updateResult.data.length === 0) {
        console.log('Session not found, creating new session instead');
        
        return supabase
          .from('pmc_copy_sessions')
          .insert([
            {
              user_id: user.id,
              input_data: inputData,
              customer_id: customerId && customerId !== 'none' && customerId !== '' ? customerId : null,
              output_type: outputType || null,
              brief_description: briefDescription || null,
            },
          ])
          .select()
          .single();
      }
      
      // If update was successful, return the first (and only) updated record
      return {
        data: updateResult.data?.[0] || null,
        error: updateResult.error
      };
    } else {
      // Create a new session
      console.log('Creating new copy session');
      
      return supabase
        .from('pmc_copy_sessions')
        .insert([
          {
            user_id: user.id,
            input_data: inputData,
            customer_id: customerId && customerId !== 'none' && customerId !== '' ? customerId : null,
            output_type: outputType || null,
            brief_description: briefDescription || null,
          },
        ])
        .select()
        .single();
    }
  } catch (error) {
    console.error('Error in saveCopySession:', error);
    throw error;
  }
};

// Function to update a specific copy session field
export const updateCopySessionField = async (
  sessionId: string, 
  fieldName: string, 
  fieldValue: any
) => {
  try {
    // Get the current authenticated user
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      throw new Error('No authenticated user found. Please log in and try again.');
    }
    
    // Create an update object with only the specific field
    const updateData: any = {};
    updateData[fieldName] = fieldValue;
    
    console.log(`Updating session ${sessionId}, field: ${fieldName}`);
    
    return supabase
      .from('pmc_copy_sessions')
      .update(updateData)
      .eq('id', sessionId)
      .eq('user_id', user.id) // Ensure user can only update their own sessions
      .select()
      .single();
  } catch (error) {
    console.error(`Error updating copy session field ${fieldName}:`, error);
    throw error;
  }
};

// Function to delete a copy session
export const deleteCopySession = async (sessionId: string) => {
  return supabase
    .from('pmc_copy_sessions')
    .delete()
    .eq('id', sessionId);
};

// Function to get copy sessions for the current user
export const getCopySessions = async () => {
  return supabase
    .from('pmc_copy_sessions')
    .select('*, pmc_customers(name)')
    .order('created_at', { ascending: false });
};

// Function to get user copy sessions
export const getUserCopySessions = async (
  userId: string,
  limit: number = 50,
  cursor?: { created_at: string; id: string }
) => {
  console.log('getUserCopySessions called with userId:', userId, 'limit:', limit, 'cursor:', cursor);

  try {
    let query = supabase
      .from('pmc_copy_sessions')
      .select('*, customer:customer_id(name)')
      .eq('user_id', userId)
      .in('scope_key', ['copy-maker', 'quick-polish', 'copy-snap']); // Show all app sessions

    const result = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit);

    console.log('getUserCopySessions result:', {
      dataLength: result.data?.length || 0,
      error: result.error
    });

    if (result.error) {
      console.error('getUserCopySessions Supabase error:', result.error);
    }

    return result;
  } catch (error) {
    console.error('getUserCopySessions exception:', error);
    return { data: null, error };
  }
};

/** Mark a copy session as accessed now (fire-and-forget, does not block UI). */
export const touchSessionAccessed = async (sessionId: string): Promise<void> => {
  try {
    await supabase.rpc('touch_session_accessed', { p_session_id: sessionId });
  } catch {
    // Non-critical — ignore errors silently
  }
};

/** Mark a saved output as accessed now (fire-and-forget, does not block UI). */
export const touchOutputAccessed = async (outputId: string): Promise<void> => {
  try {
    await supabase.rpc('touch_output_accessed', { p_output_id: outputId });
  } catch {
    // Non-critical — ignore errors silently
  }
};

// Original implementation kept as backup
export const _getUserCopySessions = async (userId: string) => {
  return supabase
    .from('pmc_copy_sessions')
    .select('*, customer:customer_id(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
};

// Function to get user token usage
export const getUserTokenUsage = async (userId: string, startDate?: string, endDate?: string) => {
  console.log('getUserTokenUsage called with userId:', userId, 'startDate:', startDate, 'endDate:', endDate);

  try {
    let query = supabase
      .from('pmc_user_tokens_used')
      .select(`
        *,
        pmc_copy_sessions(
          id,
          session_name
        )
      `)
      .eq('user_id', userId);

    // Apply date range filters if provided
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      // Add one day to endDate to include the entire end date
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      query = query.lt('created_at', endDateTime.toISOString().split('T')[0]);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    console.log('getUserTokenUsage result:', {
      dataLength: data?.length || 0,
      error: error,
      sampleData: data?.[0] // Log first record to see structure
    });

    if (error) {
      console.error('getUserTokenUsage Supabase error:', error);
      return { data: null, error };
    }

    // Transform data to include session_name at the root level
    const transformedData = (data || []).map(usage => {
      const sessionName = usage.pmc_copy_sessions?.session_name || null;
      console.log('Transform usage:', {
        id: usage.id,
        session_id: usage.session_id,
        pmc_copy_sessions: usage.pmc_copy_sessions,
        sessionName
      });
      return {
        ...usage,
        session_name: sessionName
      };
    });

    return { data: transformedData, error: null };
  } catch (error) {
    console.error('getUserTokenUsage exception:', error);
    return { data: null, error };
  }
};

// New functions for saved outputs

// Function to get a specific saved output with abort support
/**
 * @deprecated Use getSavedOutputDetail() instead
 * This function is kept for backward compatibility with abort signal support
 *
 * Gets full saved output detail (including heavy input_data/output_data)
 * Use this ONLY when opening a saved output for editing/viewing
 */
export const getSavedOutput = async (outputId: string, signal?: AbortSignal) => {
  console.log('[COMPAT] getSavedOutput called (use getSavedOutputDetail instead)');

  // Create custom fetch function with abort signal
  if (signal) {
    const fetchWithAbort = async () => {
      // Check if already aborted
      if (signal.aborted) {
        throw new DOMException('Loading aborted by the user', 'AbortError');
      }

      return supabase
        .from('pmc_saved_outputs')
        .select('*') // Full record including input_data, output_data
        .eq('id', outputId)
        .single();
    };

    // Set up abort handler
    return new Promise((resolve, reject) => {
      // Create abort handler
      const abortHandler = () => {
        reject(new DOMException('Loading aborted by the user', 'AbortError'));
      };

      // Add abort listener
      signal.addEventListener('abort', abortHandler, { once: true });

      // Execute the fetch
      fetchWithAbort()
        .then(result => {
          signal.removeEventListener('abort', abortHandler);
          resolve(result);
        })
        .catch(error => {
          signal.removeEventListener('abort', abortHandler);
          reject(error);
        });
    });
  }

  // Fallback to normal execution without abort handling
  return supabase
    .from('pmc_saved_outputs')
    .select('*') // Full record including input_data, output_data
    .eq('id', outputId)
    .single();
};

// Function to save output
export const saveSavedOutput = async (savedOutput: SavedOutput) => {
  try {
    // Get the current authenticated user
    const user = await getCurrentUser();
    
    if (!user || !user.id) {
      throw new Error('No authenticated user found. Please log in and try again.');
    }
    
    // Set the user_id to ensure it matches the authenticated user
    savedOutput.user_id = user.id;
    
    return supabase
      .from('pmc_saved_outputs')
      .insert([savedOutput])
      .select()
      .single();
  } catch (error) {
    console.error('Error in saveSavedOutput:', error);
    throw error;
  }
};

// ===========================
// Debug Logging Helpers for Saved Outputs
// ===========================
// These helpers gate verbose logging to prevent console spam in production.
// Logging is enabled in:
// - Development mode (import.meta.env.DEV)
// - Production with ?debugSavedOutputs=1 in URL
// ===========================

const isSavedOutputsDebugEnabled = (): boolean => {
  if (import.meta.env.DEV) return true;
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).has('debugSavedOutputs');
};

const debugSavedOutputsLog = (...args: any[]): void => {
  if (isSavedOutputsDebugEnabled()) {
    console.log(...args);
  }
};

const debugSavedOutputsWarn = (...args: any[]): void => {
  if (isSavedOutputsDebugEnabled()) {
    console.warn(...args);
  }
};

/**
 * getUserSavedOutputsMeta: Get lightweight metadata for list views (Dashboard)
 *
 * DATA CONTRACT:
 * - Returns SavedOutputMeta[] - metadata ONLY (no input_data/output_data)
 * - Selected fields: id, user_id, title, description, tags, session_id, saved_mode, created_at, updated_at, is_favorite
 * - EXCLUDES: input_data (50-100KB), output_data (500KB-2MB)
 * - Typical payload: ~2KB per record (vs 500KB+ with full data)
 * - Safe to load 50-100 records at once
 *
 * USAGE:
 * - Dashboard listings
 * - Pagination loads
 * - Search/filter operations
 *
 * FOR FULL DATA: Use getSavedOutputDetail(id) to fetch a single record with all fields
 */
export const getUserSavedOutputsMeta = async (
  userId: string,
  limit: number = 50,
  cursor?: { created_at: string; id: string }
): Promise<{ data: any[] | null; error: any }> => {
  debugSavedOutputsLog('[META] getUserSavedOutputsMeta called - limit:', limit, 'hasCursor:', !!cursor);

  try {
    let query = supabase
      .from('pmc_saved_outputs')
      // STRICT: Select ONLY metadata fields (NO input_data, NO output_data)
      .select('id, user_id, title, description, tags, session_id, saved_mode, created_at, updated_at, is_favorite, last_accessed_at')
      .eq('user_id', userId);

    if (cursor) {
      query = query.or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
    }

    const result = await query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit);

    debugSavedOutputsLog('[META] getUserSavedOutputsMeta result:', {
      dataLength: result.data?.length || 0,
      hasError: !!result.error
    });

    if (result.error) {
      console.error('[META] getUserSavedOutputsMeta Supabase error:', result.error);
    }

    return result;
  } catch (error) {
    console.error('[META] getUserSavedOutputsMeta exception:', error);
    return { data: null, error };
  }
};

/**
 * getSavedOutputDetail: Get full record including heavy data fields
 *
 * DATA CONTRACT:
 * - Returns SavedOutputDetail - FULL record (includes input_data, output_data)
 * - Selected fields: ALL (*) including input_data and output_data
 * - Typical payload: 500KB-2MB per record
 * - Should ONLY be called when opening a single saved output
 *
 * USAGE:
 * - UrlParamLoader: When ?savedOutputId=xxx
 * - QuickPolish: When opening a saved output
 * - CopySnap: When opening a saved output
 * - CopyMaker: When opening a saved output
 *
 * NEVER USE for list views or pagination
 */
export const getSavedOutputDetail = async (outputId: string): Promise<{ data: any | null; error: any }> => {
  debugSavedOutputsLog('[DETAIL] getSavedOutputDetail called for output');

  try {
    const result = await supabase
      .from('pmc_saved_outputs')
      .select('*') // Fetch ALL fields including heavy input_data and output_data
      .eq('id', outputId)
      .maybeSingle();

    debugSavedOutputsLog('[DETAIL] getSavedOutputDetail result:', {
      found: !!result.data,
      hasInputData: !!(result.data?.input_data),
      hasOutputData: !!(result.data?.output_data),
      hasError: !!result.error
    });

    if (result.error) {
      console.error('[DETAIL] getSavedOutputDetail Supabase error:', result.error);
    }

    return result;
  } catch (error) {
    console.error('[DETAIL] getSavedOutputDetail exception:', error);
    return { data: null, error };
  }
};

/**
 * @deprecated Use getUserSavedOutputsMeta() for lists, getSavedOutputDetail() for full records
 * This function is kept for backward compatibility but should not be used in new code
 */
export const getUserSavedOutputs = getUserSavedOutputsMeta;

// Function to delete a saved output
export const deleteSavedOutput = async (outputId: string) => {
  return supabase
    .from('pmc_saved_outputs')
    .delete()
    .eq('id', outputId);
};

// Function to toggle favorite status on a saved output
export const toggleSavedOutputFavorite = async (outputId: string, isFavorite: boolean) => {
  return supabase
    .from('pmc_saved_outputs')
    .update({ is_favorite: isFavorite })
    .eq('id', outputId);
};

// Function to save beta registration
export const saveBetaRegistration = async (betaData: {
  name: string;
  email: string;
}) => {
  return supabase
    .from('pmc_beta_register')
    .insert([betaData]);
};

// Register beta user via Edge Function (creates auth user, pmc_users entry, and sends welcome email)
export async function registerBetaUserViaEdgeFunction(name: string, email: string) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/register-beta-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': session?.access_token ? `Bearer ${session.access_token}` : `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ name, email }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to register beta user via Edge Function');
    }

    return await response.json();
  } catch (error) {
    console.error('Error calling register-beta-user Edge Function:', error);
    throw error;
  }
}

// Delete a prefill
export async function deletePrefill(prefillId: string) {
  const supabase = getSupabaseClient();
  
  const { data, error } = await supabase
    .from('pmc_prefills')
    .delete()
    .eq('id', prefillId);
  
  return { data, error };
}

/**
 * Get a single prefill by ID
 * @param prefillId - The ID of the prefill to fetch
 * @returns Promise with prefill data or error
 */
export async function getPrefill(prefillId: string): Promise<{ data: Prefill | null; error: any }> {
  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('pmc_prefills')
      .select('*')
      .eq('id', prefillId)
      .single();

    return { data, error };
  } catch (error) {
    console.error('Error getting prefill:', error);
    return { data: null, error };
  }
}

/**
 * Admin function to get all token usage data (legacy - loads all records)
 * Only accessible by admin users
 */
export async function adminGetTokenUsage(
  limit: number = 100,
  offset: number = 0,
  startDate?: string,
  endDate?: string,
  userId?: string
) {
  try {
    // Direct database query with pagination
    let query = supabase
      .from('pmc_user_tokens_used')
      .select(`
        *,
        pmc_users!inner(
          email,
          name
        ),
        pmc_copy_sessions(
          id,
          session_name
        )
      `, { count: 'exact' });

    // Apply date range filters if provided
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      // Add one day to endDate to include the entire end date
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      query = query.lt('created_at', endDateTime.toISOString().split('T')[0]);
    }

    // Apply user filter if provided
    if (userId && userId !== 'all') {
      query = query.eq('user_id', userId);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    // Transform the data to match expected format
    const transformedData = (data || []).map(usage => ({
      id: usage.id,
      user_id: usage.user_id,
      user_email: usage.pmc_users.email,
      user_name: usage.pmc_users.name,
      operation_type: usage.operation_type,
      model: usage.model,
      tokens_used: usage.tokens_used,
      cost_usd: usage.cost_usd,
      billable_units: usage.billable_units || 0,
      billing_rule_name: usage.billing_rule_name || null,
      pricing_tier: usage.pricing_tier || null,
      created_at: usage.created_at,
      session_id: usage.session_id,
      session_name: usage.pmc_copy_sessions?.session_name || null
    }));

    return {
      data: transformedData,
      error: null,
      count: count || 0,
      hasMore: (count || 0) > offset + limit
    };
  } catch (error: any) {
    console.error('Error fetching token usage:', error);
    return { data: null, error, count: 0, hasMore: false };
  }
}

/**
 * Admin function to get ALL token usage records for CSV export via Edge Function
 * Uses chunking internally to bypass Supabase client limits
 * Only accessible by admin users
 */
export async function adminGetAllTokenUsageForExport(
  startDate?: string,
  endDate?: string,
  userId?: string
) {
  try {
    const queryParams = new URLSearchParams();
    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);
    if (userId) queryParams.append('userId', userId);

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-export-token-usage?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await getSessionToken()}`,
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to export token usage');
    }

    const result = await response.json();
    return { data: result.data, error: null };
  } catch (error: any) {
    console.error('Error fetching all token usage for export:', error);
    return { data: null, error };
  }
}

interface TokenStatsParams {
  startDate?: string;
  endDate?: string;
  userId?: string;
  limit?: number;
  offset?: number;
}

interface TokenStatsResponse {
  data: any[];
  stats: {
    totalTokens: number;
    totalCost: number;
    recordCount: number;
  };
  pagination: {
    limit: number;
    offset: number;
    total: number;
    hasMore: boolean;
  };
}

/**
 * Admin function to get token usage with pagination and date filtering
 * Only accessible by admin users
 */
export async function adminGetTokenStats(params: TokenStatsParams = {}): Promise<{ data: TokenStatsResponse | null; error: any }> {
  try {
    const queryParams = new URLSearchParams();

    if (params.startDate) queryParams.append('startDate', params.startDate);
    if (params.endDate) queryParams.append('endDate', params.endDate);
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-get-token-stats?${queryParams.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${await getSessionToken()}`,
          'Content-Type': 'application/json',
        }
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch token stats');
    }

    const result = await response.json();
    return { data: result, error: null };
  } catch (error: any) {
    console.error('Error fetching token stats:', error);
    return { data: null, error };
  }
}

/**
 * Admin function to get beta registrations count
 * Only accessible by admin users
 */
export async function adminGetBetaRegistrationsCount() {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-get-beta-registrations-count`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${await getSessionToken()}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch beta registrations count');
    }

    const result = await response.json();
    return { data: result.count, error: null };
  } catch (error: any) {
    console.error('Error fetching beta registrations count:', error);
    return { data: null, error };
  }
}

/**
 * Admin function to get all users
 * Only accessible by admin users
 */
export async function adminGetUsers() {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-get-users`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getSessionToken()}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch users');
    }

    const result = await response.json();
    return { data: result.users, error: null };
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return { data: null, error };
  }
}

/**
 * Admin function to update an existing user
 * Only accessible by admin users
 */
export async function adminUpdateUser(updateData: {
  userId: string;
  password?: string;
  startDate: string | null;
  untilDate: string | null;
  tokensAllowed?: number; // Kept as tokensAllowed for backwards compatibility with edge function
  creditPlanId?: string | null;
  enforcementMode?: 'credits' | 'tokens';
  creditsGraceUnits?: number;
}) {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-update-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getSessionToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update user');
    }

    const result = await response.json();
    return { data: result, error: null };
  } catch (error: any) {
    console.error('Error updating user:', error);
    return { data: null, error };
  }
}

/**
 * Admin function to delete a user
 * Only accessible by admin users
 */
export async function adminDeleteUser(userId: string) {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-delete-user`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await getSessionToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete user');
    }

    const result = await response.json();
    return { data: result, error: null };
  } catch (error: any) {
    console.error('Error deleting user:', error);
    return { data: null, error };
  }
}

// Get prefills from database
export async function getPrefills(userId: string): Promise<{ data: Prefill[] | null; error: any }> {
  const supabase = getSupabaseClient();
  try {
    const { data, error } = await supabase
      .from('pmc_prefills')
      .select('*')
      .or(`is_public.eq.true,user_id.eq.${userId}`) // Fetch public prefills OR prefills owned by the user
      .order('category', { ascending: true })
      .order('label', { ascending: true });

    if (error) {
      console.error('Error fetching prefills:', error);
      return { data: null, error };
    }
    return { data, error: null };
  } catch (err) {
    console.error('Exception fetching prefills:', err);
    return { data: null, error: err };
  }
}

export async function updatePrefill(prefill: Prefill): Promise<{ data: Prefill | null; error: any }> {
  try {
    const supabase = getSupabaseClient();
    
    const SUPABASE_ENABLED = true; // Add this constant or import it
    
    if (!SUPABASE_ENABLED) {
      // Mock implementation for when Supabase is disabled
      console.log('Mock: Updating prefill', prefill);
      return { data: prefill, error: null };
    }
    
    // Update the prefill in the database
    const { data, error } = await supabase
      .from('pmc_prefills')
      .update({
        label: prefill.label,
        category: prefill.category,
        is_public: prefill.is_public || false,
        data: prefill.data,
        updated_at: new Date().toISOString()
      })
      .eq('id', prefill.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating prefill:', error);
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (error) {
    console.error('Error in updatePrefill:', error);
    return { data: null, error };
  }
}

// Create a new prefill
export async function createPrefill(prefillData: {
  user_id: string;
  label: string;
  category: string;
  is_public: boolean;
  data: any;
}): Promise<{ data: Prefill | null; error: any }> {
  const SUPABASE_ENABLED = true; // Add this constant or import it
  
  if (!SUPABASE_ENABLED) {
    console.log('Supabase disabled, skipping prefill creation');
    return { data: null, error: null };
  }

  try {
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('pmc_prefills')
      .insert([{
        user_id: prefillData.user_id,
        label: prefillData.label,
        category: prefillData.category,
        is_public: prefillData.is_public,
        data: prefillData.data,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      console.error('Error creating prefill:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in createPrefill:', error);
    return { data: null, error };
  }
}

/**
 * Get unique template categories for suggestion
 * @returns Promise with unique categories data
 */
export async function getUniqueTemplateCategories(): Promise<{ data: { value: string; label: string }[] | null; error: any }> {
  try {
    const { data, error } = await supabase
      .from('pmc_templates')
      .select('category')
      .not('category', 'is', null)
      .order('category', { ascending: true });

    if (error) {
      console.error('Error fetching unique template categories:', error);
      return { data: null, error };
    }

    // Extract unique categories and format them
    const uniqueCategories = [...new Set(data.map(item => item.category))];
    const formattedCategories = uniqueCategories.map(category => ({
      value: category,
      label: category
    }));

    return { data: formattedCategories, error: null };
  } catch (error) {
    console.error('Error in getUniqueTemplateCategories:', error);
    return { data: null, error };
  }
}

// Mock data functions for development without Supabase
export const getMockCustomers = (): Customer[] => {
  return [
    { id: 'mock-1', name: 'Acme Corp', created_at: '2023-01-01T00:00:00Z' },
    { id: 'mock-2', name: 'XYZ Industries', created_at: '2023-01-02T00:00:00Z' },
    { id: 'mock-3', name: 'Tech Innovators', created_at: '2023-01-03T00:00:00Z' },
  ];
};

export const getMockCopySessions = (): CopySession[] => {
  return [
    {
      id: 'mock-session-1',
      user_id: 'mock-user',
      input_data: {
        language: 'English',
        tone: 'Professional',
        wordCount: '200-300',
        targetAudience: 'Business professionals',
        inputText: 'Original text for session 1',
      },
      improved_copy: 'Improved copy for session 1',
      alternative_copy: 'Alternative copy for session 1',
      created_at: '2023-01-10T00:00:00Z',
      customer_id: 'mock-1',
      pmc_customers: { name: 'Acme Corp' },
      output_type: 'Website Copy',
      brief_description: 'Homepage redesign',
    },
    {
      id: 'mock-session-2',
      user_id: 'mock-user',
      input_data: {
        language: 'English',
        tone: 'Casual',
        wordCount: '100-200',
        targetAudience: 'General public',
        inputText: 'Original text for session 2',
      },
      improved_copy: 'Improved copy for session 2',
      alternative_copy: null,
      created_at: '2023-01-15T00:00:00Z',
      customer_id: 'mock-2',
      pmc_customers: { name: 'XYZ Industries' },
      output_type: 'Email Campaign',
      brief_description: 'Product launch',
    },
  ];
};

// Function to get mock token usage data
export const getMockTokenUsage = (): TokenUsage[] => {
  return [
    {
      id: 'mock-token-1',
      user_email: 'user@example.com',
      token_usage: 3245,
      token_cost: 0.006490,
      usage_date: '2023-05-10',
      created_at: '2023-05-10T14:23:10Z',
      control_executed: 'generate_create_copy',
      brief_description: 'Website homepage copy',
      model: 'deepseek-chat',
      copy_source: 'Copy Generator'
    },
    {
      id: 'mock-token-2',
      user_email: 'user@example.com',
      token_usage: 2134,
      token_cost: 0.004268,
      usage_date: '2023-05-12',
      created_at: '2023-05-12T09:45:22Z',
      control_executed: 'generate_improve_copy',
      brief_description: 'Product description refinement',
      model: 'gpt-4o',
      copy_source: 'Copy Generator'
    },
    {
      id: 'mock-token-3',
      user_email: 'user@example.com',
      token_usage: 1567,
      token_cost: 0.003134,
      usage_date: '2023-05-15',
      created_at: '2023-05-15T16:12:05Z',
      control_executed: 'evaluate_prompt',
      brief_description: 'SEO content analysis',
      model: 'deepseek-chat',
      copy_source: 'Copy Generator'
    },
    {
      id: 'mock-token-4',
      user_email: 'user@example.com',
      token_usage: 4321,
      token_cost: 0.008642,
      usage_date: '2023-05-18',
      created_at: '2023-05-18T11:30:45Z',
      control_executed: 'generate_humanized_version',
      brief_description: 'Email campaign humanization',
      model: 'gpt-4-turbo',
      copy_source: 'Copy Generator'
    },
    {
      id: 'mock-token-5',
      user_email: 'user@example.com',
      token_usage: 1876,
      token_cost: 0.003752,
      usage_date: '2023-05-20',
      created_at: '2023-05-20T15:20:30Z',
      control_executed: 'generate_headlines',
      brief_description: 'Blog post headline options',
      model: 'gpt-3.5-turbo',
      copy_source: 'Copy Generator'
    }
  ];
};

// Function to get mock saved outputs
export const getMockSavedOutputs = (): SavedOutput[] => {
  return [
    {
      id: 'mock-saved-1',
      user_id: 'mock-user',
      customer_id: 'mock-1',
      customer: { id: 'mock-1', name: 'Acme Corp', created_at: '2023-01-01T00:00:00Z' },
      brief_description: 'Homepage copy with Steve Jobs voice',
      language: 'English',
      tone: 'Professional',
      model: 'gpt-4o',
      selected_persona: 'Steve Jobs',
      input_snapshot: {
        tab: 'create',
        language: 'English',
        tone: 'Professional',
        wordCount: 'Medium: 100-200',
        competitorUrls: [],
        businessDescription: 'Mock business description for saved output',
        isLoading: false,
        model: 'gpt-4o'
      } as FormData,
      output_content: {
        improvedCopy: 'Mock improved copy',
        alternativeCopy: 'Mock alternative copy',
        humanizedCopy: 'Mock humanized copy',
        alternativeHumanizedCopy: 'Mock alternative humanized copy',
        restyledImprovedCopy: 'Mock Steve Jobs improved copy',
        headlines: ['Headline 1', 'Headline 2', 'Headline 3']
      },
      saved_at: '2023-06-01T10:30:00Z'
    },
    {
      id: 'mock-saved-2',
      user_id: 'mock-user',
      brief_description: 'Product page copy in Spanish',
      language: 'Spanish',
      tone: 'Friendly',
      model: 'deepseek-chat',
      input_snapshot: {
        tab: 'create',
        language: 'Spanish',
        tone: 'Professional',
        wordCount: 'Short: 50-100',
        competitorUrls: [],
        businessDescription: 'Mock Spanish business description for saved output',
        isLoading: false,
        model: 'deepseek-chat'
      } as FormData,
      output_content: {
        improvedCopy: 'This is a sample saved output for demo purposes.',
        generatedVersions: []
      }
    }
  ];
};

// Function to get user subscription data
export const getUserSubscriptionData = async (userId: string) => {
  console.log('getUserSubscriptionData called with userId:', userId);

  try {
    const result = await supabase
      .from('pmc_users')
      .select(`
        start_date,
        until_date,
        credit_plan_id,
        credit_plans:credit_plan_id (
          plan_key,
          plan_name,
          credits_monthly
        )
      `)
      .eq('id', userId)
      .single();

    console.log('getUserSubscriptionData result:', {
      data: result.data,
      error: result.error
    });

    if (result.error) {
      console.error('getUserSubscriptionData Supabase error:', result.error);
    }

    return result;
  } catch (error) {
    console.error('getUserSubscriptionData exception:', error);
    return { data: null, error };
  }
};

// Function to get mock subscription data for development
export const getMockSubscriptionData = () => {
  return {
    start_date: '2025-01-01',
    until_date: '2025-12-31'
  };
};

// User access control function
export interface AccessCheckResult {
  hasAccess: boolean;
  message: string;
  details?: {
    isSubscriptionValid: boolean;
    isWithinTokenLimit: boolean;
    tokensUsed: number;
    tokensAllowed: number;
    untilDate: string | null;
  };
  // Phase 4A: Credits enforcement fields
  enforcementMode?: 'credits' | 'tokens';
  creditsAllowed?: number;
  creditsUsedInPeriod?: number;
  creditsRemaining?: number;
  creditsPeriodStart?: string;
  creditsPeriodEnd?: string;
  creditsNextReset?: string;
  creditsGraceUnits?: number;
  creditsCalcError?: boolean;
}

/**
 * ============================================================================
 * PHASE 2A: CREDITS BALANCE COMPUTATION (DISPLAY ONLY - NO ENFORCEMENT)
 * ============================================================================
 */

export interface CreditsBalance {
  creditsAllowed: number;
  creditsUsed: number;
  creditsRemaining: number;
  periodStart: string; // ISO date string
  periodEnd: string; // ISO date string
  periodStartDay: number;
  rolloverEnabled: boolean;
  note: string | null;
  totalApiCostUsd?: number; // Total API cost across ALL users for the current billing period
}

/**
 * Compute the current credits billing period for a user using a rolling 30-day window
 * anchored to the user's subscription start date.
 *
 * @param periodStartDay - Day of month when credits reset (matches start_date day)
 * @returns Object with periodStart and periodEnd as ISO date strings
 */
export const computeCreditsPeriod = (periodStartDay: number): { periodStart: string; periodEnd: string } => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-11
  const currentDay = now.getDate();

  let periodStart: Date;
  let periodEnd: Date;

  if (currentDay >= periodStartDay) {
    // Current period started this month on periodStartDay
    periodStart = new Date(currentYear, currentMonth, periodStartDay, 0, 0, 0, 0);
    // Next reset is 30 days after periodStart
    periodEnd = new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000 - 1);
  } else {
    // Current period started last month on periodStartDay
    periodStart = new Date(currentYear, currentMonth - 1, periodStartDay, 0, 0, 0, 0);
    // Next reset is 30 days after periodStart
    periodEnd = new Date(periodStart.getTime() + 30 * 24 * 60 * 60 * 1000 - 1);
  }

  return {
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString()
  };
};

/**
 * Get credits balance for a user (Phase 2A - Display Only)
 * This computes credits used/remaining for the current billing period.
 * DOES NOT AFFECT ACCESS - tokens_remaining is still the only enforcement gate.
 *
 * @param userId - The user's ID
 * @returns CreditsBalance object with all credits metrics
 */
export const getCreditsBalance = async (userId: string): Promise<{ data: CreditsBalance | null; error: any }> => {
  try {
    console.log('📊 Computing credits balance for user:', userId);

    // 1. Get user's credits plan settings from pmc_users
    const { data: userData, error: userError } = await supabase
      .from('pmc_users')
      .select('credits_allowed, credits_period_start_day, credits_rollover_enabled, credits_note')
      .eq('id', userId)
      .single();

    if (userError || !userData) {
      console.error('❌ Error fetching user credits plan:', userError);
      return { data: null, error: userError };
    }

    const creditsAllowed = userData.credits_allowed || 0;
    const periodStartDay = userData.credits_period_start_day || 1;
    const rolloverEnabled = userData.credits_rollover_enabled || false;
    const note = userData.credits_note || null;

    // 2. Compute current billing period
    const { periodStart, periodEnd } = computeCreditsPeriod(periodStartDay);

    console.log('📅 Credits period:', { periodStart, periodEnd, periodStartDay });

    // 3. Compute credits used in current period (SUM of billable_units)
    const { data: usageData, error: usageError } = await supabase
      .from('pmc_user_tokens_used')
      .select('billable_units')
      .eq('user_id', userId)
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd);

    if (usageError) {
      console.error('❌ Error fetching credits usage:', usageError);
      return { data: null, error: usageError };
    }

    const creditsUsed = (usageData || []).reduce((sum, record) => sum + (record.billable_units || 0), 0);
    const creditsRemaining = Math.max(0, creditsAllowed - creditsUsed);

    console.log('💳 Credits balance computed:', { creditsAllowed, creditsUsed, creditsRemaining });

    // 4. Compute total API cost for ALL users in current period (admin-only metric)
    const { data: costData, error: costError } = await supabase
      .from('pmc_user_tokens_used')
      .select('cost_usd')
      .gte('created_at', periodStart)
      .lte('created_at', periodEnd);

    let totalApiCostUsd: number | undefined = undefined;
    if (!costError && costData) {
      totalApiCostUsd = costData.reduce((sum, record) => sum + (record.cost_usd || 0), 0);
      console.log('💰 Total API cost (all users) computed:', totalApiCostUsd);
    }

    return {
      data: {
        creditsAllowed,
        creditsUsed,
        creditsRemaining,
        periodStart,
        periodEnd,
        periodStartDay,
        rolloverEnabled,
        note,
        totalApiCostUsd
      },
      error: null
    };
  } catch (error) {
    console.error('❌ Exception in getCreditsBalance:', error);
    return { data: null, error };
  }
};

/**
 * Check if a user has access to the application based on subscription and credits usage
 * @param userId - The user's ID from auth.users
 * @param userEmail - The user's email address
 * @returns AccessCheckResult with hasAccess boolean and message
 *
 * ============================================================================
 * PHASE 4B-2: CREDITS-ONLY ENFORCEMENT
 * ============================================================================
 * Token system has been completely removed (Phase 4B-2).
 * Only credits-based enforcement remains.
 *
 * Enforcement logic:
 * - Enforces based on (credits_remaining + credits_grace_units) > 0
 * - credits_remaining = credits_allowed - SUM(billable_units in current period)
 * - Monthly billing period determined by credits_period_start_day
 * - Credits reset at beginning of each billing period
 *
 * Access is granted if:
 * 1. Subscription dates are valid (if set)
 * 2. User has an active credit plan (credits_allowed > 0)
 * 3. Credits remaining (with grace) > 0
 * ============================================================================
 */
export const checkUserAccess = async (userId: string, userEmail: string): Promise<AccessCheckResult> => {
  try {
    console.log('🔍 [PHASE 4B-2] ACCESS CHECK for user:', { userId, userEmail });

    // Validate input parameters
    if (!userId || !userEmail) {
      console.error('❌ Invalid parameters for access check:', { userId, userEmail });
      return {
        hasAccess: false,
        message: "Access denied: your subscription has expired or you have consumed all your available credits. Please update your plan."
      };
    }

    // Add timeout wrapper for database query to prevent hanging
    const queryTimeout = (ms: number) => new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Database query timeout')), ms)
    );

    // Wait briefly for JWT to settle after auth state change
    await new Promise(resolve => setTimeout(resolve, 100));

    // Get user's subscription details from pmc_users table (Phase 4B-2: tokens removed)
    const userDataQuery = supabase
      .from('pmc_users')
      .select(`
        id,
        email,
        start_date,
        until_date,
        enforcement_mode,
        credits_allowed,
        credits_period_start_day,
        credits_grace_units,
        credit_plan_id
      `)
      .eq('id', userId)
      .single();

    // Race the query against a 3-second timeout
    const { data: userData, error: userError } = await Promise.race([
      userDataQuery,
      queryTimeout(3000).then(() => ({ data: null, error: { message: 'Query timeout' } }))
    ]) as any;

    if (userError) {
      console.error('❌ Error fetching user subscription data:', userError);

      // If it's a timeout error, provide a helpful message
      if (userError.message === 'Query timeout') {
        console.log('⏱️ Database query timed out - possible RLS or connection issue');
        return {
          hasAccess: false,
          message: "Login timeout: Unable to verify your account. This may be due to database connectivity issues. Please try again or contact support."
        };
      }

      // If we can't fetch user data, DENY access for security
      return {
        hasAccess: false,
        message: "Unable to verify account access. Please try again or contact support."
      };
    }

    if (!userData) {
      console.error('❌ No user subscription data found');
      // If no user data found, DENY access
      return {
        hasAccess: false,
        message: "No account found. Please ensure your account is properly set up."
      };
    }

    console.log('📊 User subscription data:', {
      ...userData,
      enforcement_mode: userData.enforcement_mode || 'credits'
    });

    // 1. Check subscription date validity (SAME FOR BOTH MODES)
    // Use date-only comparison (YYYY-MM-DD strings) to avoid timezone issues
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0]; // YYYY-MM-DD format

    const startDateStr = userData.start_date; // Already in YYYY-MM-DD format from DB
    const untilDateStr = userData.until_date; // Already in YYYY-MM-DD format from DB

    let isSubscriptionValid = true;

    // If dates are set, check if current date is within subscription period
    if (startDateStr && untilDateStr) {
      isSubscriptionValid = todayStr >= startDateStr && todayStr <= untilDateStr;
      console.log('🗓️ Subscription date check:', {
        today: todayStr,
        start: startDateStr,
        until: untilDateStr,
        valid: isSubscriptionValid
      });
    } else if (untilDateStr) {
      // Only until date is set, check if not expired
      isSubscriptionValid = todayStr <= untilDateStr;
      console.log('🗓️ Until date check:', {
        today: todayStr,
        until: untilDateStr,
        valid: isSubscriptionValid
      });
    }

    if (!isSubscriptionValid) {
      console.log('❌ Subscription has expired');
      return {
        hasAccess: false,
        message: "Access denied: your subscription has expired. Please update your plan.",
        details: {
          isSubscriptionValid: false,
          isWithinTokenLimit: true,
          tokensUsed: 0,
          tokensAllowed: 0,
          untilDate: userData.until_date
        }
      };
    }

    // 2. CREDITS ENFORCEMENT (Phase 4B-2: ONLY CREDITS)
    const enforcementMode = 'credits'; // Always credits (Phase 4B-2)
    console.log('💳 Using CREDITS enforcement (Phase 4B-2: credits-only)');

    const creditsAllowed = userData.credits_allowed || 0;
      const creditsPeriodStartDay = userData.credits_period_start_day || 1;
      const creditsGraceUnits = userData.credits_grace_units || 0;

      // Check if user has no credit plan assigned
      if (creditsAllowed === 0) {
        console.log('❌ No credit plan assigned (credits_allowed = 0)');
        return {
          hasAccess: false,
          message: "No credit plan assigned. Your account doesn't have an active credit plan yet. Please contact support.",
          details: {
            isSubscriptionValid: true,
            isWithinTokenLimit: true,
            tokensUsed: 0,
            tokensAllowed: 0,
            untilDate: userData.until_date
          },
          enforcementMode: 'credits',
          creditsAllowed: 0,
          creditsUsedInPeriod: 0,
          creditsRemaining: 0,
          creditsGraceUnits
        };
      }

      // Compute current billing period
      const { periodStart, periodEnd } = computeCreditsPeriod(creditsPeriodStartDay);

      // Compute next reset date (add 1 month to periodEnd)
      const nextResetDate = new Date(periodEnd);
      nextResetDate.setDate(nextResetDate.getDate() + 1);
      const creditsNextReset = nextResetDate.toISOString();

      console.log('📅 Credits period:', {
        periodStart,
        periodEnd,
        nextReset: creditsNextReset,
        periodStartDay: creditsPeriodStartDay
      });

      // Compute credits used in current period (SUM of billable_units)
      // FAIL OPEN on query errors to avoid accidental lockouts
      let creditsUsedInPeriod = 0;
      let creditsCalcError = false;

      try {
        const usageQuery = supabase
          .from('pmc_user_tokens_used')
          .select('billable_units')
          .eq('user_id', userId)
          .gte('created_at', periodStart)
          .lte('created_at', periodEnd);

        // Race the query against a 2-second timeout
        const { data: usageData, error: usageError } = await Promise.race([
          usageQuery,
          queryTimeout(2000).then(() => ({ data: null, error: { message: 'Query timeout' } }))
        ]) as any;

        if (usageError) {
          console.error('⚠️ Error fetching credits usage (FAIL OPEN):', usageError);
          creditsCalcError = true;
          // FAIL OPEN: Allow access but flag the error
        } else {
          creditsUsedInPeriod = (usageData || []).reduce((sum, record) => sum + (record.billable_units || 0), 0);
        }
      } catch (err) {
        console.error('⚠️ Exception in credits calculation (FAIL OPEN):', err);
        creditsCalcError = true;
        // FAIL OPEN: Allow access but flag the error
      }

      const creditsRemaining = creditsAllowed - creditsUsedInPeriod;
      const creditsWithGrace = creditsRemaining + creditsGraceUnits;
      const hasAccess = creditsWithGrace > 0 || creditsCalcError;

      console.log('💳 Credits check:', {
        creditsAllowed,
        creditsUsedInPeriod,
        creditsRemaining,
        creditsGraceUnits,
        creditsWithGrace,
        hasAccess,
        creditsCalcError,
        percentage: ((creditsUsedInPeriod / creditsAllowed) * 100).toFixed(1) + '%'
      });

      if (creditsCalcError) {
        console.log('⚠️ Credits calculation error - FAILING OPEN (granting access with warning)');
      }

      if (!hasAccess && !creditsCalcError) {
        console.log('❌ Credits limit reached');
        return {
          hasAccess: false,
          message: "Credits limit reached. You've used all credits for this billing period.",
          details: {
            isSubscriptionValid: true,
            isWithinTokenLimit: true, // Not relevant in credits mode
            tokensUsed: 0,
            tokensAllowed: 0,
            untilDate: userData.until_date
          },
          enforcementMode: 'credits',
          creditsAllowed,
          creditsUsedInPeriod,
          creditsRemaining,
          creditsPeriodStart: periodStart,
          creditsPeriodEnd: periodEnd,
          creditsNextReset,
          creditsGraceUnits,
          creditsCalcError: false
        };
      }

      console.log('✅ Access granted - subscription valid and within credits limits');
      return {
        hasAccess: true,
        message: "Access granted.",
        details: {
          isSubscriptionValid: true,
          isWithinTokenLimit: true, // Not enforced in credits mode but keep for compatibility
          tokensUsed: 0,
          tokensAllowed: 0,
          untilDate: userData.until_date
        },
        enforcementMode: 'credits',
        creditsAllowed,
        creditsUsedInPeriod,
        creditsRemaining,
        creditsPeriodStart: periodStart,
        creditsPeriodEnd: periodEnd,
        creditsNextReset,
        creditsGraceUnits,
        creditsCalcError
      };

  } catch (error) {
    console.error('❌ Error in checkUserAccess:', error);
    return {
      hasAccess: false,
      message: "Access denied: your subscription has expired or you have consumed all your available credits. Please update your plan."
    };
  }
};

export interface UserPreferences {
  id: string;
  user_id: string;
  show_start_hub: boolean;
  created_at: string;
  updated_at: string;
}

export const getUserPreferences = async (userId: string): Promise<UserPreferences | null> => {
  try {
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user preferences:', error);
      return null;
    }

    return data;
  } catch (err) {
    console.error('Exception in getUserPreferences:', err);
    return null;
  }
};

export const updateUserPreferences = async (
  userId: string,
  preferences: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at'>>
): Promise<UserPreferences | null> => {
  try {
    const existingPrefs = await getUserPreferences(userId);

    if (existingPrefs) {
      const { data, error } = await supabase
        .from('user_preferences')
        .update({
          ...preferences,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating user preferences:', error);
        return null;
      }

      return data;
    } else {
      const { data, error } = await supabase
        .from('user_preferences')
        .insert({
          user_id: userId,
          ...preferences
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user preferences:', error);
        return null;
      }

      return data;
    }
  } catch (err) {
    console.error('Exception in updateUserPreferences:', err);
    return null;
  }
};

export const dismissStartHub = async (userId: string): Promise<boolean> => {
  try {
    const result = await updateUserPreferences(userId, {
      show_start_hub: false
    });

    return result !== null;
  } catch (err) {
    console.error('Exception in dismissStartHub:', err);
    return false;
  }
};

export const enableStartHub = async (userId: string): Promise<boolean> => {
  try {
    const result = await updateUserPreferences(userId, {
      show_start_hub: true
    });

    return result !== null;
  } catch (err) {
    console.error('Exception in enableStartHub:', err);
    return false;
  }
};

// ─── Absolute Score Persistence ──────────────────────────────────────────────

/**
 * Upsert an absolute score for a generated content item.
 * Safe to call multiple times — later call wins.
 */
export const saveAbsoluteScore = async (
  userId: string,
  versionId: string,
  breakdown: AbsoluteScoreBreakdown,
  sessionId?: string | null
): Promise<void> => {
  try {
    await supabase.from('pmc_version_scores').upsert({
      version_id: versionId,
      user_id: userId,
      session_id: sessionId ?? null,
      absolute_score: breakdown.total,
      score_breakdown: breakdown,
      scored_at: new Date().toISOString(),
    }, { onConflict: 'version_id' });
  } catch (err) {
    console.error('saveAbsoluteScore error:', err);
  }
};

/**
 * Load persisted absolute scores for a set of version IDs.
 * Returns a map of versionId → AbsoluteScoreBreakdown.
 */
export const loadAbsoluteScores = async (
  versionIds: string[]
): Promise<Record<string, AbsoluteScoreBreakdown>> => {
  if (!versionIds.length) return {};
  try {
    const { data, error } = await supabase
      .from('pmc_version_scores')
      .select('version_id, score_breakdown')
      .in('version_id', versionIds);
    if (error || !data) return {};
    const map: Record<string, AbsoluteScoreBreakdown> = {};
    for (const row of data) {
      if (row.score_breakdown) map[row.version_id] = row.score_breakdown as AbsoluteScoreBreakdown;
    }
    return map;
  } catch {
    return {};
  }
};
