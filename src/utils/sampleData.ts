import { FormState } from '../types';
import { DEFAULT_FORM_STATE } from '../constants';

// Create sample data for "Create New Copy" mode
export const createSampleData = (): FormState => {
  return {
    ...DEFAULT_FORM_STATE,
    tab: 'create',
    language: 'English',
    tone: 'Professional',
    wordCount: 'Medium: 100-200',
    competitorUrls: [],
    pageType: 'Homepage',
    businessDescription: 'Custom web design and development that drives results for growing businesses. We craft high-performance websites tailored to your brand — built to convert visitors into customers. With over 15 years of experience, we combine strategic thinking with technical excellence.',
    targetAudience: 'Small and medium-sized businesses looking to strengthen their online presence and generate more leads.',
    keyMessage: 'Our professional web design will increase your visibility and drive more sales.',
    desiredEmotion: 'Trust, Professionalism',
    callToAction: 'Request a free consultation',
    brandValues: 'Innovation, Quality, Experience',
    keywords: 'web design, development, professional, custom',
    context: 'Competitive market where businesses need a high-quality website to stand out',
    briefDescription: 'Homepage copy for a web design agency',
    model: 'gpt-4o',
    evaluateInputs: true,
    generateScore: true,
    generateHeadlines: true,
    isLoading: false,
    isEvaluating: false
  };
};

// Create sample data for "Improve Existing Copy" mode
export const improveSampleData = (): FormState => {
  return {
    ...DEFAULT_FORM_STATE,
    tab: 'improve',
    language: 'English',
    tone: 'Professional',
    wordCount: 'Custom',
    customWordCount: 500,
    competitorUrls: [],
    originalCopy: 'Custom web design and development that drives results for growing businesses. We craft high-performance websites tailored to your brand — built to convert visitors into customers. With over 15 years of experience, we combine strategic thinking with technical excellence.',
    targetAudience: 'Small and medium-sized businesses looking to strengthen their online presence and generate more leads.',
    keyMessage: 'Our professional web design will increase your visibility and drive more sales.',
    desiredEmotion: 'Trust, Professionalism',
    callToAction: 'Request a free consultation',
    brandValues: 'Innovation, Quality, Experience',
    keywords: 'web design, development, professional, custom',
    context: 'Competitive market where businesses need a high-quality website to stand out',
    briefDescription: 'Improved copy for a web design agency',
    model: 'gpt-4o',
    evaluateInputs: true,
    generateScore: true,
    generateHeadlines: true,
    isLoading: false,
    isEvaluating: false
  };
};