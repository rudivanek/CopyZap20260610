import React from 'react';
import ReactDOM from 'react-dom';
import { FileText, Check, Loader2 } from 'lucide-react';
import { Button } from '../../../ui/button';

/**
 * Blocking progress modal for the client report export.
 *
 * Generating a report runs an AI call and can take the better part of a
 * minute. Until now that happened with no feedback at all: the operator
 * clicked and nothing visibly changed, which invites a second click and a
 * second AI call.
 *
 * The backdrop is intentionally opaque to input — the app is disabled while
 * this is up, so the session cannot be edited underneath a report that is
 * already being built from it.
 */

export type ReportStepId = 'narrative' | 'build' | 'audit' | 'render';

export interface ReportStep {
  id: ReportStepId;
  label: string;
}

export const REPORT_STEPS: ReportStep[] = [
  { id: 'narrative', label: 'Redactando el análisis con IA' },
  { id: 'build', label: 'Construyendo el reporte' },
  { id: 'audit', label: 'Auditando el resultado' },
  { id: 'render', label: 'Generando el archivo' },
];

interface ReportProgressModalProps {
  isOpen: boolean;
  /** Index into REPORT_STEPS. Steps before it render as done. */
  currentStep: number;
  /** Set once cancel is pressed, so the button can report that it heard you. */
  isCancelling?: boolean;
  onCancel: () => void;
}

const ReportProgressModal: React.FC<ReportProgressModalProps> = ({
  isOpen,
  currentStep,
  isCancelling = false,
  onCancel,
}) => {
  if (!isOpen) return null;

  // Rendered through a portal to document.body. The sidebar creates its own
  // stacking context, so a modal rendered inside it lets sidebar elements —
  // the template search field, field-hint text — bleed through on top of the
  // dialog. Every other overlay in this sidebar portals for the same reason.
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* No onClick: clicking away must not dismiss work in progress. */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        role="dialog"
        aria-modal="true"
        aria-live="polite"
        className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-2 px-5 pt-5 pb-4 border-b border-gray-200 dark:border-gray-700">
          <FileText className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">
            Generando el reporte de copy
          </h2>
        </div>

        <div className="px-5 py-5 space-y-3">
          {REPORT_STEPS.map((step, i) => {
            const done = i < currentStep;
            const active = i === currentStep;
            return (
              <div key={step.id} className="flex items-center gap-3">
                <span className="w-5 h-5 flex-none flex items-center justify-center">
                  {done ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : active ? (
                    <Loader2 className="w-4 h-4 animate-spin text-gray-500 dark:text-gray-400" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700" />
                  )}
                </span>
                <span
                  className={
                    done
                      ? 'text-sm text-gray-500 dark:text-gray-400'
                      : active
                        ? 'text-sm font-medium text-gray-900 dark:text-white'
                        : 'text-sm text-gray-400 dark:text-gray-600'
                  }
                >
                  {step.label}
                </span>
              </div>
            );
          })}

          <p className="pt-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
            El análisis con IA es la parte lenta: puede tardar hasta un minuto.
            No cierres esta pestaña.
          </p>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" size="sm" onClick={onCancel} disabled={isCancelling}>
            {isCancelling ? 'Cancelando…' : 'Cancelar'}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ReportProgressModal;
