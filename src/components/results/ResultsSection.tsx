import React from 'react';
import { FormState, StructuredCopyOutput } from '../../types';
import PromptEvaluation from './PromptEvaluation';
import CopyOutput from './CopyOutput';
import AlternativeCopy from './AlternativeCopy';
import HeadlineIdeas from './HeadlineIdeas';
import ScoreCard from './ScoreCard';
import ContentQualityIndicator from '../ui/ContentQualityIndicator';
import { calculateTargetWordCount } from '../../services/api/utils';
import OnDemandGeneration from '../ui/OnDemandGeneration';

// Import additional icons for the new buttons
import { FileText, BarChart2 } from 'lucide-react';

interface ResultsSectionProps {
  formState: FormState;
  setFormState: (state: FormState) => void;
  onGenerateAlternative: (index?: number) => Promise<void>;
  onGenerateRestyled: (contentType: 'improved' | 'alternative' | 'humanized', alternativeIndex?: number, humanizedIndex?: number, selectedPersona?: string) => Promise<void>;
  onGenerateHeadlines: () => Promise<void>;
  onGenerateScores: (contentType: 'improved' | 'alternative' | 'humanized' | 'restyledImproved' | 'restyledAlternative' | 'restyledHumanized', alternativeIndex?: number, humanizedIndex?: number) => Promise<void>;
  onViewPrompts: () => void;
  onCompareScores: () => void;
  onSaveOutput: () => void;
  onCopyAllAsMarkdown: () => void;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({
  formState,
  setFormState,
  onGenerateAlternative,
  onGenerateRestyled,
  onGenerateHeadlines,
  onGenerateScores,
  onViewPrompts,
  onCompareScores,
  onSaveOutput,
  onCopyAllAsMarkdown
}) => {
  // Check if we have any results to show
  const hasResults = formState.copyResult || formState.promptEvaluation;
  
  if (!hasResults) {
    return null;
  }

  // Calculate target word count using the shared utility function
  const targetWordCount = calculateTargetWordCount(formState);

  // Create loading state getters
  const isGeneratingAlternative = formState.isGeneratingAlternative || false;
  const isGeneratingHumanized = formState.isGeneratingHumanized || false;
  const isGeneratingAlternativeHumanized = formState.isGeneratingAlternativeHumanized || false;
  const isGeneratingHeadlines = formState.isGeneratingHeadlines || false;
  const isGeneratingScores = formState.isGeneratingScores || false;
  const isGeneratingRestyledImproved = formState.isGeneratingRestyledImproved || false;
  const isGeneratingRestyledAlternative = formState.isGeneratingRestyledAlternative || false;
  const isGeneratingRestyledHumanized = formState.isGeneratingRestyledHumanized || false;

  // Function to count words in a string
  const countWords = (text: string): number => {
    return text ? text.trim().split(/\s+/).length : 0;
  };

  // Check if any alternative versions are currently being generated
  const isAlternativeBeingGenerated = isGeneratingAlternative || (formState.alternativeGenerationIndex !== undefined);

  return (
    <div id="results-section" className="space-y-8">
      {/* Section Title */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
          <div className="w-0.5 h-6 rounded bg-gray-300 dark:bg-gray-600 mr-3"></div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Generated Results</h2>
        </div>
        
        {/* Floating Action Buttons for actions that apply to all results */}
        <div className="flex items-center space-x-2">
          {formState.copyResult && (
            <>
              <button 
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 p-2 rounded-full"
                onClick={onViewPrompts}
                title="View Prompts"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7z"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </button>
              <button 
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 p-2 rounded-full"
                onClick={onSaveOutput}
                title="Save Output"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              </button>
              <button 
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 p-2 rounded-full"
                onClick={onCompareScores}
                title="Compare Content Scores"
              >
                <BarChart2 size={20} />
              </button>
              <button
                className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 p-2 rounded-full"
                onClick={onCopyAllAsMarkdown}
                title="Copy All as Markdown"
              >
                <FileText size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Original Input Content */}
      {(formState.tab === 'create' && formState.businessDescription) || 
       (formState.tab === 'improve' && formState.originalCopy) ? (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                  <div className="w-1 h-5 bg-gray-300 dark:bg-gray-700 mr-2"></div>
                  {formState.tab === 'create' ? 'Business Description' : 'Original Copy'}
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {countWords(formState.tab === 'create' ? formState.businessDescription || '' : formState.originalCopy || '')} words
                </span>
              </div>
            </div>
            
            <div className="bg-gray-100 dark:bg-gray-800 rounded-md p-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap custom-scrollbar">
              {formState.tab === 'create' ? formState.businessDescription : formState.originalCopy}
            </div>
            
            {/* Show quality score if available */}
            {formState.tab === 'create' && formState.businessDescriptionScore && (
              <div className="mt-2">
                <ContentQualityIndicator 
                  score={formState.businessDescriptionScore} 
                  isLoading={false} 
                />
              </div>
            )}
            
            {formState.tab === 'improve' && formState.originalCopyScore && (
              <div className="mt-2">
                <ContentQualityIndicator 
                  score={formState.originalCopyScore} 
                  isLoading={false} 
                />
              </div>
            )}
          </div>
        </div>
      ) : null}
      
      {/* Prompt Evaluation - Display if available */}
      {formState.promptEvaluation && (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
          <PromptEvaluation 
            evaluation={formState.promptEvaluation}
            isLoading={false}
          />
        </div>
      )}
      
      {formState.copyResult && (
        <>
          {/* Standard Copy Section */}
          <div className="space-y-6 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <div className="w-0.5 h-4 rounded bg-gray-300 dark:bg-gray-600 mr-2"></div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Standard Version</h2>
                </div>
              </div>
              
              <div className="space-y-6">
                {/* Improved Copy - With Score Card - INTEGRATED WITH DOTTED LINE */}
                {formState.copyResult.improvedCopy && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                    {/* Content Section */}
                    <CopyOutput
                      title={`Improved Copy`}
                      content={formState.copyResult.improvedCopy}
                      isLoading={formState.isLoading}
                      targetWordCount={targetWordCount}
                    />
                    
                    {/* OnDemand Generation Buttons */}
                    <div className="px-6 pb-4">
                      <OnDemandGeneration
                        formState={formState}
                        contentType="improved"
                        onGenerateAlternative={onGenerateAlternative}
                        onGenerateRestyled={(contentType, alternativeIndex, humanizedIndex, selectedPersona) => 
                          onGenerateRestyled(contentType, alternativeIndex, humanizedIndex, selectedPersona)}
                        onGenerateScore={onGenerateScores}
                      />
                    </div>

                    {/* Dotted Line Separator - Only if we have a score to show */}
                    {(formState.generateScores || formState.copyResult.improvedCopyScore) && (
                      <div className="border-t border-dashed border-gray-200 dark:border-gray-700 mx-6 my-3"></div>
                    )}
                    
                    {/* Score Section - Without its own border */}
                    {(formState.generateScores || formState.copyResult.improvedCopyScore) && (
                      <ScoreCard
                        title="Improved Copy Score"
                        overall={formState.copyResult.improvedCopyScore?.overall}
                        clarity={formState.copyResult.improvedCopyScore?.clarity}
                        persuasiveness={formState.copyResult.improvedCopyScore?.persuasiveness}
                        toneMatch={formState.copyResult.improvedCopyScore?.toneMatch}
                        engagement={formState.copyResult.improvedCopyScore?.engagement}
                        wordCountAccuracy={formState.copyResult.improvedCopyScore?.wordCountAccuracy}
                        improvementExplanation={formState.copyResult.improvedCopyScore?.improvementExplanation}
                        suggestions={formState.copyResult.improvedCopyScore?.suggestions}
                        isLoading={isGeneratingScores || (formState.generateScores && !formState.copyResult.improvedCopyScore)}
                      />
                    )}
                  </div>
                )}
                
                {/* Restyled Improved Copy - Only show if it exists */}
                {formState.copyResult.restyledImprovedVersions && formState.copyResult.restyledImprovedVersions.length > 0 && (
                  <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-4">
                    {formState.copyResult.restyledImprovedVersions.map((version, versionIndex) => (
                      <div key={`restyled-improved-${versionIndex}`} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 mb-4">
                        {/* Content Section */}
                        <CopyOutput
                          title={`Improved Copy (${version.persona}'s Voice)`}
                          content={version.content}
                          isLoading={isGeneratingRestyledImproved}
                          targetWordCount={targetWordCount}
                        />
                        
                        {/* Score Section - Only shown if we're displaying the first/default version which has a score */}
                        {(versionIndex === 0 && (formState.generateScores || formState.copyResult.restyledImprovedCopyScore)) && (
                          <>
                            <div className="border-t border-dashed border-gray-200 dark:border-gray-700 mx-6 my-3"></div>
                            <ScoreCard
                              title={`${version.persona}'s Voice Score`}
                              overall={formState.copyResult.restyledImprovedCopyScore?.overall}
                              clarity={formState.copyResult.restyledImprovedCopyScore?.clarity}
                              persuasiveness={formState.copyResult.restyledImprovedCopyScore?.persuasiveness}
                              toneMatch={formState.copyResult.restyledImprovedCopyScore?.toneMatch}
                              engagement={formState.copyResult.restyledImprovedCopyScore?.engagement}
                              wordCountAccuracy={formState.copyResult.restyledImprovedCopyScore?.wordCountAccuracy}
                              improvementExplanation={formState.copyResult.restyledImprovedCopyScore?.improvementExplanation}
                              suggestions={formState.copyResult.restyledImprovedCopyScore?.suggestions}
                              isLoading={isGeneratingScores || (formState.generateScores && !formState.copyResult.restyledImprovedCopyScore)}
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Handle legacy format for backward compatibility */}
                {!formState.copyResult.restyledImprovedVersions && formState.copyResult.restyledImprovedCopy && (
                  <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-4">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                      {/* Content Section */}
                      <CopyOutput
                        title={`Improved Copy (${formState.copyResult.restyledImprovedCopyPersona || formState.selectedPersona}'s Voice)`}
                        content={formState.copyResult.restyledImprovedCopy}
                        isLoading={isGeneratingRestyledImproved}
                        targetWordCount={targetWordCount}
                      />
                      
                      {/* Dotted Line Separator - Only if we have a score to show */}
                      {(formState.generateScores || formState.copyResult.restyledImprovedCopyScore) && (
                        <div className="border-t border-dashed border-gray-200 dark:border-gray-700 mx-6 my-3"></div>
                      )}
                      
                      {/* Score Section */}
                      {(formState.generateScores || formState.copyResult.restyledImprovedCopyScore) && (
                        <ScoreCard
                          title={`${formState.copyResult.restyledImprovedCopyPersona || formState.selectedPersona}'s Voice Score`}
                          overall={formState.copyResult.restyledImprovedCopyScore?.overall}
                          clarity={formState.copyResult.restyledImprovedCopyScore?.clarity}
                          persuasiveness={formState.copyResult.restyledImprovedCopyScore?.persuasiveness}
                          toneMatch={formState.copyResult.restyledImprovedCopyScore?.toneMatch}
                          engagement={formState.copyResult.restyledImprovedCopyScore?.engagement}
                          wordCountAccuracy={formState.copyResult.restyledImprovedCopyScore?.wordCountAccuracy}
                          improvementExplanation={formState.copyResult.restyledImprovedCopyScore?.improvementExplanation}
                          suggestions={formState.copyResult.restyledImprovedCopyScore?.suggestions}
                          isLoading={isGeneratingScores || (formState.generateScores && !formState.copyResult.restyledImprovedCopyScore)}
                        />
                      )}
                    </div>
                  </div>
                )}
                
                {/* Alternative Versions - Support for multiple alternative versions */}
                {formState.copyResult.alternativeVersions && formState.copyResult.alternativeVersions.length > 0 ? (
                  // Map over alternative versions array
                  formState.copyResult.alternativeVersions.map((alternativeVersion, index) => (
                    <div key={`alt-${index}`} className="space-y-4 mb-6 border-t border-gray-200 dark:border-gray-800 pt-6">
                      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                        {/* Content Section */}
                        <AlternativeCopy
                          title={`${index + 1}.) Alternative Version`}
                          content={alternativeVersion}
                          isLoading={isGeneratingAlternative && index === formState.alternativeGenerationIndex}
                          targetWordCount={targetWordCount}
                        />
                        
                        {/* OnDemand Generation Buttons */}
                        <div className="px-6 pb-4">
                          <OnDemandGeneration
                            formState={formState}
                            contentType="alternative"
                            alternativeIndex={index}
                            onGenerateAlternative={onGenerateAlternative}
                            onGenerateRestyled={(contentType, alternativeIndex, humanizedIndex, selectedPersona) =>
                              onGenerateRestyled(contentType, alternativeIndex, humanizedIndex, selectedPersona)}
                            onGenerateScore={onGenerateScores}
                          />
                        </div>
                        
                        {/* Dotted Line Separator - Only if we have a score */}
                        {formState.copyResult.alternativeVersionScores && 
                         formState.copyResult.alternativeVersionScores[index] && (
                          <div className="border-t border-dashed border-gray-200 dark:border-gray-700 mx-6 my-3"></div>
                        )}
                        
                        {/* Score Section */}
                        {formState.copyResult.alternativeVersionScores && 
                         formState.copyResult.alternativeVersionScores[index] && (
                          <ScoreCard
                            title={`Alternative ${index + 1} Score`}
                            overall={formState.copyResult.alternativeVersionScores[index].overall}
                            clarity={formState.copyResult.alternativeVersionScores[index].clarity}
                            persuasiveness={formState.copyResult.alternativeVersionScores[index].persuasiveness}
                            toneMatch={formState.copyResult.alternativeVersionScores[index].toneMatch}
                            engagement={formState.copyResult.alternativeVersionScores[index].engagement}
                            wordCountAccuracy={formState.copyResult.alternativeVersionScores[index].wordCountAccuracy}
                            improvementExplanation={formState.copyResult.alternativeVersionScores[index].improvementExplanation}
                            suggestions={formState.copyResult.alternativeVersionScores[index].suggestions}
                            isLoading={isGeneratingScores}
                          />
                        )}
                      </div>
                      
                      {/* Restyled Alternative Copy - Check if corresponding restyled version exists */}
                      {formState.copyResult.restyledAlternativeVersionCollections && 
                       formState.copyResult.restyledAlternativeVersionCollections
                        .filter(collection => collection.alternativeIndex === index)
                        .map(collection => 
                          collection.versions.map((version, versionIndex) => (
                            <div key={`restyled-alt-${index}-${versionIndex}`} className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-4">
                              <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                                {/* Content Section */}
                                <AlternativeCopy
                                  title={`${index + 1}.) Alternative Copy (${version.persona}'s Voice)`}
                                  content={version.content}
                                  isLoading={isGeneratingRestyledAlternative}
                                  targetWordCount={targetWordCount}
                                />
                                
                                {/* Dotted Line Separator - Only if we have a score and this is the first version */}
                                {versionIndex === 0 && (formState.generateScores || (formState.copyResult.restyledAlternativeVersionScores && 
                                 formState.copyResult.restyledAlternativeVersionScores[index])) && (
                                  <div className="border-t border-dashed border-gray-200 dark:border-gray-700 mx-6 my-3"></div>
                                )}
                                
                                {/* Score Section - Only for the first version */}
                                {versionIndex === 0 && (formState.generateScores || (formState.copyResult.restyledAlternativeVersionScores && 
                                 formState.copyResult.restyledAlternativeVersionScores[index])) && (
                                  <ScoreCard
                                    title={`${index + 1}.) ${version.persona}'s Alternative Score`}
                                    overall={formState.copyResult.restyledAlternativeVersionScores?.[index]?.overall}
                                    clarity={formState.copyResult.restyledAlternativeVersionScores?.[index]?.clarity}
                                    persuasiveness={formState.copyResult.restyledAlternativeVersionScores?.[index]?.persuasiveness}
                                    toneMatch={formState.copyResult.restyledAlternativeVersionScores?.[index]?.toneMatch}
                                    engagement={formState.copyResult.restyledAlternativeVersionScores?.[index]?.engagement}
                                    wordCountAccuracy={formState.copyResult.restyledAlternativeVersionScores?.[index]?.wordCountAccuracy}
                                    improvementExplanation={formState.copyResult.restyledAlternativeVersionScores?.[index]?.improvementExplanation}
                                    suggestions={formState.copyResult.restyledAlternativeVersionScores?.[index]?.suggestions}
                                    isLoading={isGeneratingScores || (formState.generateScores && !formState.copyResult.restyledAlternativeVersionScores?.[index])}
                                  />
                                )}
                              </div>
                            </div>
                          ))
                        )}
                    </div>
                  ))
                ) : isAlternativeBeingGenerated ? (
                  // Show loading state if an alternative version is being generated
                  <div className="space-y-4 mb-6 border-t border-gray-200 dark:border-gray-800 pt-6">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                      <AlternativeCopy
                        title="Alternative Version"
                        content={""}
                        isLoading={true}
                        targetWordCount={targetWordCount}
                      />
                    </div>
                  </div>
                ) : formState.copyResult.alternativeCopy ? (
                  // Fallback to original single version display
                  <div className="space-y-4 mb-6 border-t border-gray-200 dark:border-gray-800 pt-6">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                      {/* Content Section */}
                      <AlternativeCopy
                        title="Alternative Version"
                        content={formState.copyResult.alternativeCopy}
                        isLoading={isGeneratingAlternative}
                        targetWordCount={targetWordCount}
                      />
                      
                      {/* Dotted Line Separator - Only if we have a score */}
                      {formState.copyResult.alternativeCopyScore && (
                        <div className="border-t border-dashed border-gray-200 dark:border-gray-700 mx-6 my-3"></div>
                      )}
                      
                      {/* Score Section */}
                      {formState.copyResult.alternativeCopyScore && (
                        <ScoreCard
                          title="Alternative Copy Score"
                          overall={formState.copyResult.alternativeCopyScore?.overall}
                          clarity={formState.copyResult.alternativeCopyScore?.clarity}
                          persuasiveness={formState.copyResult.alternativeCopyScore?.persuasiveness}
                          toneMatch={formState.copyResult.alternativeCopyScore?.toneMatch}
                          engagement={formState.copyResult.alternativeCopyScore?.engagement}
                          wordCountAccuracy={formState.copyResult.alternativeCopyScore?.wordCountAccuracy}
                          improvementExplanation={formState.copyResult.alternativeCopyScore?.improvementExplanation}
                          suggestions={formState.copyResult.alternativeCopyScore?.suggestions}
                          isLoading={isGeneratingScores || (formState.generateScores && !formState.copyResult.alternativeCopyScore)}
                        />
                      )}
                    </div>
                  </div>
                ) : null}
                
                {/* Restyled Alternative Copy - Only show if it exists and we don't have alternative versions array */}
                {!formState.copyResult.alternativeVersions && formState.copyResult.restyledAlternativeVersionCollection && formState.copyResult.restyledAlternativeVersionCollection.length > 0 && (
                  <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-4">
                    {formState.copyResult.restyledAlternativeVersionCollection.map((version, versionIndex) => (
                      <div key={`restyled-alternative-${versionIndex}`} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 mb-4">
                        {/* Content Section */}
                        <AlternativeCopy
                          title={`Alternative Copy (${version.persona}'s Voice)`}
                          content={version.content}
                          isLoading={isGeneratingRestyledAlternative}
                          targetWordCount={targetWordCount}
                        />
                        
                        {/* Score Section - Only shown if we're displaying the first/default version which has a score */}
                        {(versionIndex === 0 && (formState.generateScores || formState.copyResult.restyledAlternativeCopyScore)) && (
                          <>
                            <div className="border-t border-dashed border-gray-200 dark:border-gray-700 mx-6 my-3"></div>
                            <ScoreCard
                              title={`${version.persona}'s Alternative Score`}
                              overall={formState.copyResult.restyledAlternativeCopyScore?.overall}
                              clarity={formState.copyResult.restyledAlternativeCopyScore?.clarity}
                              persuasiveness={formState.copyResult.restyledAlternativeCopyScore?.persuasiveness}
                              toneMatch={formState.copyResult.restyledAlternativeCopyScore?.toneMatch}
                              engagement={formState.copyResult.restyledAlternativeCopyScore?.engagement}
                              wordCountAccuracy={formState.copyResult.restyledAlternativeCopyScore?.wordCountAccuracy}
                              improvementExplanation={formState.copyResult.restyledAlternativeCopyScore?.improvementExplanation}
                              suggestions={formState.copyResult.restyledAlternativeCopyScore?.suggestions}
                              isLoading={isGeneratingScores || (formState.generateScores && !formState.copyResult.restyledAlternativeCopyScore)}
                            />
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Handle legacy format for backward compatibility */}
                {!formState.copyResult.alternativeVersions && 
                 !formState.copyResult.restyledAlternativeVersionCollection && 
                 formState.copyResult.restyledAlternativeCopy && (
                  <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-4">
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                      {/* Content Section */}
                      <AlternativeCopy
                        title={`Alternative Copy (${formState.copyResult.restyledAlternativeCopyPersona || formState.selectedPersona}'s Voice)`}
                        content={formState.copyResult.restyledAlternativeCopy}
                        isLoading={isGeneratingRestyledAlternative}
                        targetWordCount={targetWordCount}
                      />
                      
                      {/* Dotted Line Separator - Only if we have a score */}
                      {(formState.generateScores || formState.copyResult.restyledAlternativeCopyScore) && (
                        <div className="border-t border-dashed border-gray-200 dark:border-gray-700 mx-6 my-3"></div>
                      )}
                      
                      {/* Score Section */}
                      {(formState.generateScores || formState.copyResult.restyledAlternativeCopyScore) && (
                        <ScoreCard
                          title={`${formState.copyResult.restyledAlternativeCopyPersona || formState.selectedPersona}'s Alternative Score`}
                          overall={formState.copyResult.restyledAlternativeCopyScore?.overall}
                          clarity={formState.copyResult.restyledAlternativeCopyScore?.clarity}
                          persuasiveness={formState.copyResult.restyledAlternativeCopyScore?.persuasiveness}
                          toneMatch={formState.copyResult.restyledAlternativeCopyScore?.toneMatch}
                          engagement={formState.copyResult.restyledAlternativeCopyScore?.engagement}
                          wordCountAccuracy={formState.copyResult.restyledAlternativeCopyScore?.wordCountAccuracy}
                          improvementExplanation={formState.copyResult.restyledAlternativeCopyScore?.improvementExplanation}
                          isLoading={isGeneratingScores || (formState.generateScores && !formState.copyResult.restyledAlternativeCopyScore)}
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Humanized Copies Section */}
          {(formState.copyResult.humanizedVersions && formState.copyResult.humanizedVersions.length > 0) || 
           formState.copyResult.humanizedCopy ? (
            <div className="space-y-6 rounded-lg overflow-hidden">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center mb-4">
                  <div className="w-0.5 h-4 rounded bg-gray-300 dark:bg-gray-600 mr-2"></div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Humanized Version</h2>
                </div>
                
                <div className="space-y-6">
                  {/* Render multiple humanized versions if available */}
                  {formState.copyResult.humanizedVersions && formState.copyResult.humanizedVersions.length > 0 ? (
                    formState.copyResult.humanizedVersions.map((humanizedVersion, index) => (
                      <div key={`humanized-${index}`} className="space-y-4 mb-6">
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                          {/* Content Section */}
                          <CopyOutput
                            title={`${index + 1}.) Humanized Version`}
                            content={humanizedVersion}
                            isLoading={isGeneratingHumanized}
                            targetWordCount={targetWordCount}
                          />
                          
                          {/* OnDemand Generation Buttons */}
                          <div className="px-6 pb-4">
                            <OnDemandGeneration
                              formState={formState}
                              contentType="humanized"
                              onGenerateAlternative={onGenerateAlternative}
                              onGenerateRestyled={(contentType, alternativeIndex, humanizedIndex, selectedPersona) =>
                                onGenerateRestyled(contentType, alternativeIndex, humanizedIndex, selectedPersona)}
                              onGenerateScore={onGenerateScores}
                            />
                          </div>
                          
                          {/* Dotted Line Separator - Only if we have a score */}
                          {(formState.generateScores || (formState.copyResult.humanizedVersionScores && 
                           formState.copyResult.humanizedVersionScores[index])) && (
                            <div className="border-t border-dashed border-gray-200 dark:border-gray-700 mx-6 my-3"></div>
                          )}
                          
                          {/* Score Section */}
                          {(formState.generateScores || (formState.copyResult.humanizedVersionScores && 
                           formState.copyResult.humanizedVersionScores[index])) && (
                            <ScoreCard
                              title={`${index + 1}.) Humanized Version Score`}
                              overall={formState.copyResult.humanizedVersionScores?.[index]?.overall}
                              clarity={formState.copyResult.humanizedVersionScores?.[index]?.clarity}
                              persuasiveness={formState.copyResult.humanizedVersionScores?.[index]?.persuasiveness}
                              toneMatch={formState.copyResult.humanizedVersionScores?.[index]?.toneMatch}
                              engagement={formState.copyResult.humanizedVersionScores?.[index]?.engagement}
                              wordCountAccuracy={formState.copyResult.humanizedVersionScores?.[index]?.wordCountAccuracy}
                              improvementExplanation={formState.copyResult.humanizedVersionScores?.[index]?.improvementExplanation}
                              suggestions={formState.copyResult.humanizedVersionScores?.[index]?.suggestions}
                              isLoading={isGeneratingScores || (formState.generateScores && !formState.copyResult.humanizedVersionScores?.[index])}
                            />
                          )}
                        </div>
                        
                        {/* Restyled Humanized Version if available */}
                        {formState.copyResult.restyledHumanizedVersionCollections && 
                         formState.copyResult.restyledHumanizedVersionCollections
                          .filter(collection => collection.humanizedIndex === index)
                          .map(collection => 
                            collection.versions.map((version, versionIndex) => (
                              <div key={`restyled-hum-${index}-${versionIndex}`} className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-4">
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                                  {/* Content Section */}
                                  <CopyOutput
                                    title={`${index + 1}.) Humanized Version (${version.persona}'s Voice)`}
                                    content={version.content}
                                    isLoading={isGeneratingRestyledHumanized}
                                    targetWordCount={targetWordCount}
                                  />
                                  
                                  {/* Dotted Line Separator - Only if we have a score and this is the first version */}
                                  {versionIndex === 0 && (formState.generateScores || (formState.copyResult.restyledHumanizedVersionScores && 
                                   formState.copyResult.restyledHumanizedVersionScores[index])) && (
                                    <div className="border-t border-dashed border-gray-200 dark:border-gray-700 mx-6 my-3"></div>
                                  )}
                                  
                                  {/* Score Section - Only for the first version */}
                                  {versionIndex === 0 && (formState.generateScores || (formState.copyResult.restyledHumanizedVersionScores && 
                                   formState.copyResult.restyledHumanizedVersionScores[index])) && (
                                    <ScoreCard
                                      title={`${index + 1}.) ${version.persona}'s Humanized Score`}
                                      overall={formState.copyResult.restyledHumanizedVersionScores?.[index]?.overall}
                                      clarity={formState.copyResult.restyledHumanizedVersionScores?.[index]?.clarity}
                                      persuasiveness={formState.copyResult.restyledHumanizedVersionScores?.[index]?.persuasiveness}
                                      toneMatch={formState.copyResult.restyledHumanizedVersionScores?.[index]?.toneMatch}
                                      engagement={formState.copyResult.restyledHumanizedVersionScores?.[index]?.engagement}
                                      wordCountAccuracy={formState.copyResult.restyledHumanizedVersionScores?.[index]?.wordCountAccuracy}
                                      improvementExplanation={formState.copyResult.restyledHumanizedVersionScores?.[index]?.improvementExplanation}
                                      suggestions={formState.copyResult.restyledHumanizedVersionScores?.[index]?.suggestions}
                                      isLoading={isGeneratingScores || (formState.generateScores && !formState.copyResult.restyledHumanizedVersionScores?.[index])}
                                    />
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                      </div>
                    ))
                  ) : (
                    // Fallback to original single humanized version display
                    formState.copyResult.humanizedCopy && (
                      <div className="space-y-4 mb-6">
                        <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                          {/* Content Section */}
                          <CopyOutput
                            title="Improved Humanized Copy"
                            content={formState.copyResult.humanizedCopy}
                            isLoading={isGeneratingHumanized}
                            targetWordCount={targetWordCount}
                          />
                          
                          {/* OnDemand Generation Buttons */}
                          <div className="px-6 pb-4">
                            <OnDemandGeneration
                              formState={formState}
                              contentType="humanized"
                              onGenerateAlternative={onGenerateAlternative}
                              onGenerateRestyled={(contentType, alternativeIndex, humanizedIndex, selectedPersona) =>
                                onGenerateRestyled(contentType, alternativeIndex, humanizedIndex, selectedPersona)}
                              onGenerateScore={onGenerateScores}
                            />
                          </div>
                          
                          {/* Dotted Line Separator - Only if we have a score */}
                          {formState.copyResult.humanizedCopyScore && (
                            <div className="border-t border-dashed border-gray-200 dark:border-gray-700 mx-6 my-3"></div>
                          )}
                          
                          {/* Score Section */}
                          {formState.copyResult.humanizedCopyScore && (
                            <ScoreCard
                              title="Humanized Copy Score"
                              overall={formState.copyResult.humanizedCopyScore.overall}
                              clarity={formState.copyResult.humanizedCopyScore.clarity}
                              persuasiveness={formState.copyResult.humanizedCopyScore.persuasiveness}
                              toneMatch={formState.copyResult.humanizedCopyScore.toneMatch}
                              engagement={formState.copyResult.humanizedCopyScore.engagement}
                              wordCountAccuracy={formState.copyResult.humanizedCopyScore.wordCountAccuracy}
                              improvementExplanation={formState.copyResult.humanizedCopyScore.improvementExplanation}
                              suggestions={formState.copyResult.humanizedCopyScore.suggestions}
                              isLoading={isGeneratingScores}
                            />
                          )}
                        </div>
                        
                        {/* Restyled Humanized Copy - Only show if it exists and we don't have humanized versions array */}
                        {formState.copyResult.restyledHumanizedVersionCollection && formState.copyResult.restyledHumanizedVersionCollection.length > 0 && (
                          <div className="space-y-4 mb-6 ml-4 border-l border-gray-200 dark:border-gray-700 pl-4">
                            {formState.copyResult.restyledHumanizedVersionCollection.map((version, versionIndex) => (
                              <div key={`restyled-humanized-${versionIndex}`} className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 mb-4">
                                {/* Content Section */}
                                <CopyOutput
                                  title={`Humanized Copy (${version.persona}'s Voice)`}
                                  content={version.content}
                                  isLoading={isGeneratingRestyledHumanized}
                                  targetWordCount={targetWordCount}
                                />
                                
                                {/* Score Section - Only shown if we're displaying the first/default version which has a score */}
                                {(versionIndex === 0 && (formState.generateScores || formState.copyResult.restyledHumanizedCopyScore)) && (
                                  <>
                                    <div className="border-t border-dashed border-gray-200 dark:border-gray-700 mx-6 my-3"></div>
                                    <ScoreCard
                                      title={`${version.persona}'s Humanized Score`}
                                      overall={formState.copyResult.restyledHumanizedCopyScore?.overall}
                                      clarity={formState.copyResult.restyledHumanizedCopyScore?.clarity}
                                      persuasiveness={formState.copyResult.restyledHumanizedCopyScore?.persuasiveness}
                                      toneMatch={formState.copyResult.restyledHumanizedCopyScore?.toneMatch}
                                      engagement={formState.copyResult.restyledHumanizedCopyScore?.engagement}
                                      wordCountAccuracy={formState.copyResult.restyledHumanizedCopyScore?.wordCountAccuracy}
                                      improvementExplanation={formState.copyResult.restyledHumanizedCopyScore?.improvementExplanation}
                                      suggestions={formState.copyResult.restyledHumanizedCopyScore?.suggestions}
                                      isLoading={isGeneratingScores || (formState.generateScores && !formState.copyResult.restyledHumanizedCopyScore)}
                                    />
                                  </>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Handle legacy format for backward compatibility */}
                        {!formState.copyResult.restyledHumanizedVersionCollection && 
                         formState.copyResult.restyledHumanizedCopy && (
                          <div className="space-y-4 mb-6 ml-4 border-l border-gray-200 dark:border-gray-700 pl-4">
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                              {/* Content Section */}
                              <CopyOutput
                                title={`Improved Humanized Copy (${formState.copyResult.restyledHumanizedCopyPersona || formState.selectedPersona}'s Voice)`}
                                content={formState.copyResult.restyledHumanizedCopy}
                                isLoading={isGeneratingRestyledHumanized}
                                targetWordCount={targetWordCount}
                              />
                              
                              {/* Dotted Line Separator - Only if we have a score */}
                              {(formState.generateScores || formState.copyResult.restyledHumanizedCopyScore) && (
                                <div className="border-t border-dashed border-gray-200 dark:border-gray-700 mx-6 my-3"></div>
                              )}
                              
                              {/* Score Section */}
                              {(formState.generateScores || formState.copyResult.restyledHumanizedCopyScore) && (
                                <ScoreCard
                                  title={`${formState.copyResult.restyledHumanizedCopyPersona || formState.selectedPersona}'s Humanized Score`}
                                  overall={formState.copyResult.restyledHumanizedCopyScore?.overall}
                                  clarity={formState.copyResult.restyledHumanizedCopyScore?.clarity}
                                  persuasiveness={formState.copyResult.restyledHumanizedCopyScore?.persuasiveness}
                                  toneMatch={formState.copyResult.restyledHumanizedCopyScore?.toneMatch}
                                  engagement={formState.copyResult.restyledHumanizedCopyScore?.engagement}
                                  wordCountAccuracy={formState.copyResult.restyledHumanizedCopyScore?.wordCountAccuracy}
                                  improvementExplanation={formState.copyResult.restyledHumanizedCopyScore?.improvementExplanation}
                                  suggestions={formState.copyResult.restyledHumanizedCopyScore?.suggestions}
                                  isLoading={isGeneratingScores || (formState.generateScores && !formState.copyResult.restyledHumanizedCopyScore)}
                                />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          ) : null}
          
          {/* Headlines - Only show if they exist or button to generate */}
          {(formState.copyResult.headlines && formState.copyResult.headlines.length > 0) || 
           (formState.generateHeadlines && formState.copyResult.improvedCopy && !formState.copyResult.headlines) ||
           (formState.copyResult.restyledHeadlinesVersions && formState.copyResult.restyledHeadlinesVersions.length > 0) ? (
            <div className="bg-gray-50 dark:bg-gray-900 p-4 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-0.5 h-4 rounded bg-gray-300 dark:bg-gray-600 mr-2"></div>
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">Headline Options</h2>
                </div>
                {/* Show generate button if headlines are enabled but not yet generated */}
                {formState.generateHeadlines && formState.copyResult.improvedCopy && !formState.copyResult.headlines && (
                  <button
                    onClick={onGenerateHeadlines}
                    disabled={isGeneratingHeadlines}
                    className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 text-sm font-medium flex items-center"
                  >
                    {isGeneratingHeadlines ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>
                        Generate Headlines
                      </>
                    )}
                  </button>
                )}
              </div>
              
              {/* Show headlines if available */}
              {formState.copyResult.headlines && formState.copyResult.headlines.length > 0 ? (
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                  <HeadlineIdeas
                    headlines={formState.copyResult.headlines}
                    isLoading={isGeneratingHeadlines}
                  />
                </div>
              ) : (
                /* Show loading state if headlines are enabled but not yet generated */
                formState.generateHeadlines && formState.copyResult.improvedCopy && !formState.copyResult.headlines && (
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900">
                    <HeadlineIdeas
                      headlines={[]}
                      isLoading={true}
                    />
                  </div>
                )
              )}
              
              {/* Show restyled headline versions if available */}
              {formState.copyResult.restyledHeadlinesVersions && formState.copyResult.restyledHeadlinesVersions.length > 0 && (
                formState.copyResult.restyledHeadlinesVersions.map((version, index) => (
                  <div key={`restyled-headlines-${index}`} className="mt-4 ml-4 border-l border-gray-200 dark:border-gray-700 pl-4">
                    <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
                      <HeadlineIdeas
                        headlines={version.headlines}
                        isLoading={false}
                        title={`Headline Ideas (${version.persona}'s Voice)`}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : null}
          
          {/* Restyled Headline Ideas - Only show if they exist */}
          {formState.copyResult.restyledHeadlines && formState.copyResult.restyledHeadlines.length > 0 && 
           !formState.copyResult.restyledHeadlinesVersions && (
            <div className="ml-4 border-l border-gray-200 dark:border-gray-700 pl-4">
              <div className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg overflow-hidden">
                <HeadlineIdeas
                  headlines={formState.copyResult.restyledHeadlines}
                  isLoading={false}
                  title={`Headline Ideas (${formState.copyResult.restyledHeadlinesPersona || formState.selectedPersona}'s Voice)`}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ResultsSection;