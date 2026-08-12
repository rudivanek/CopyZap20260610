import React from 'react';
import ReactDOM from 'react-dom';
import { AlertTriangle, AlertOctagon, X } from 'lucide-react';
import { Button } from '../../../ui/button';
import type { AuditIssue } from '../../../../utils/clientReport/auditReportData';

/**
 * Result of the pre-export audit, shown before the file is written.
 *
 * Replaces window.confirm, which truncated the list at a few lines — the
 * operator could see there were five issues but not read them, which defeats
 * the point of naming them.
 *
 * Errors and warnings are separated deliberately. An error means the report
 * should not reach a client; a warning means look before sending. Collapsing
 * them into one list would train the reader to skim past both.
 */

interface ReportAuditModalProps {
  isOpen: boolean;
  issues: AuditIssue[];
  onExportAnyway: () => void;
  onCancel: () => void;
}

const ReportAuditModal: React.FC<ReportAuditModalProps> = ({
  isOpen,
  issues,
  onExportAnyway,
  onCancel,
}) => {
  if (!isOpen) return null;

  const errors = issues.filter(i => i.severity === 'error');
  const warns = issues.filter(i => i.severity === 'warn');

  // Rendered through a portal to document.body. The sidebar creates its own
  // stacking context, so a modal rendered inside it lets sidebar elements —
  // the template search field, field-hint text — bleed through on top of the
  // dialog. Every other overlay in this sidebar portals for the same reason.
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col max-h-[85vh]"
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {errors.length ? (
              <AlertOctagon className="w-4 h-4 text-red-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            )}
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Report audit
            </h2>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-4 overflow-y-auto">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {errors.length > 0 && (
              <span className="font-medium text-gray-900 dark:text-white">
                This report has {errors.length === 1 ? 'a serious problem' : `${errors.length} serious problems`}.{' '}
              </span>
            )}
            {errors.length > 0
              ? "It shouldn't go to a client until that's resolved."
              : 'Nothing prevents sending it, but these points are worth a look first.'}
          </p>

          {errors.length > 0 && (
            <div className="mb-5">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 mb-2">
                {errors.length === 1 ? 'Serious problem' : 'Serious problems'}
              </h3>
              <ul className="space-y-2">
                {errors.map((issue, i) => (
                  <li
                    key={`e-${i}`}
                    className="flex gap-2 text-sm text-gray-800 dark:text-gray-200 leading-relaxed rounded-md bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/40 px-3 py-2"
                  >
                    <AlertOctagon className="w-4 h-4 flex-none mt-0.5 text-red-500" />
                    <span>{issue.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {warns.length > 0 && (
            <div>
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-2">
                {warns.length === 1 ? 'Warning' : `Warnings (${warns.length})`}
              </h3>
              <ul className="space-y-2">
                {warns.map((issue, i) => (
                  <li
                    key={`w-${i}`}
                    className="flex gap-2 text-sm text-gray-700 dark:text-gray-300 leading-relaxed rounded-md bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 px-3 py-2"
                  >
                    <AlertTriangle className="w-4 h-4 flex-none mt-0.5 text-amber-500" />
                    <span>{issue.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" size="sm" onClick={onCancel}>
            Don't export
          </Button>
          {/* Wording, not styling, carries the warning: the operator owns the
              business and must always be able to force the export, but it
              should never be one indistinguishable click from a clean one. */}
          <Button variant="secondary" size="sm" onClick={onExportAnyway}>
            {errors.length ? 'Export anyway (incomplete)' : 'Export anyway'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ReportAuditModal;
