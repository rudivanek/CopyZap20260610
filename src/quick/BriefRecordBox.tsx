import React from 'react';
import FormattedContent from '../components/ui/FormattedContent';
import type { QuickBriefRecord } from '../engine/runQuickPipeline';

const DEFAULT_COPY_TEXT = 'text-gray-700 dark:text-gray-300 [&_ul]:list-disc [&_ol]:list-decimal';

/**
 * Shows the brief a piece of copy was written from: the fields the user filled
 * in, the website (if any) and, when the draft was edited before scoring, the
 * original draft as CopyZap wrote it. Collapsed by default.
 */
const BriefRecordBox: React.FC<{ brief: QuickBriefRecord; copyText?: string }> = ({ brief, copyText = DEFAULT_COPY_TEXT }) => (
  <details className="text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 p-3">
    <summary className="cursor-pointer select-none font-semibold text-gray-900 dark:text-gray-100">Your brief</summary>
    <dl className="mt-3 grid grid-cols-1 sm:grid-cols-[max-content_1fr] gap-x-4 gap-y-1">
      {brief.fields.map(field => (
        <React.Fragment key={field.label}>
          <dt className="text-gray-600 dark:text-gray-400">{field.label}</dt>
          <dd className="break-words whitespace-pre-line">{field.value}</dd>
        </React.Fragment>
      ))}
      {brief.website && (
        <>
          <dt className="text-gray-600 dark:text-gray-400">Website</dt>
          <dd className="break-words">
            {brief.website}{' '}
            <span className="text-gray-500 dark:text-gray-400">
              {brief.websiteRead === false ? '(could not be read)' : '(read for facts)'}
            </span>
          </dd>
        </>
      )}
    </dl>
    {brief.editedBeforeScoring && (
      <div className="mt-3 flex flex-col gap-2">
        <p className="text-gray-600 dark:text-gray-400">The draft was changed before it was scored.</p>
        <details>
          <summary className="cursor-pointer select-none underline">Show the draft as CopyZap wrote it</summary>
          <div className="mt-2">
            <FormattedContent content={brief.draft} className={copyText} colorScores={false} />
          </div>
        </details>
      </div>
    )}
  </details>
);

export default BriefRecordBox;
