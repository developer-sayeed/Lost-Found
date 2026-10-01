import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  FileText,
  Edit,
  Trash2,
  Calendar,
  User,
  Award,
  Hash,
  Palette,
  Check,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Certificate } from '../../types';
import { CertificatePreviewStage } from './CertificatePreviewStage';
import { downloadCertificatePdf, downloadCertificatePng, printCertificate } from './CertificateActions';
import { useApp } from '../../context/AppContext';
import { toast } from 'react-toastify';

interface CertificateViewModalProps {
  certificate: Certificate | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (cert: Certificate) => void;
  onDelete?: (certId: string) => void;
  onPrint?: (cert: Certificate) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  canPrint?: boolean;
  canSave?: boolean;
}

export const CertificateViewModal: React.FC<CertificateViewModalProps> = ({
  certificate,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onPrint,
  canEdit = true,
  canDelete = true,
  canPrint = true,
  canSave = true
}) => {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [isDownloadingPng, setIsDownloadingPng] = useState<boolean>(false);

  const { settings } = useApp();
  const isPreviewMode = settings.certificatePrintBehavior === 'preview' || settings.certificateEnablePrintPreview === true;

  if (!isOpen || !certificate) return null;

  const idPrefix = 'view-modal';

  const handlePrint = async () => {
    if (onPrint) {
      onPrint(certificate);
      onClose();
      return;
    }
    try {
      setIsPrinting(true);
      await printCertificate(
        `${idPrefix}-certificate-container`,
        `${certificate.recipientName} - ${certificate.title}`
      );
      toast.success('Print dialog opened.');
    } catch (err: any) {
      console.error('Print error:', err);
      toast.error('Could not initiate print.');
    } finally {
      setIsPrinting(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      const cleanNum = certificate.certificateNumber || 'CERT';
      const cleanName = certificate.recipientName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Warwick_Certificate_${cleanNum}_${cleanName}.pdf`;
      await downloadCertificatePdf(`${idPrefix}-certificate-container`, filename);
      toast.success('Certificate PDF downloaded successfully!');
    } catch (err: any) {
      console.error('PDF download error:', err);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadPng = async () => {
    try {
      setIsDownloadingPng(true);
      const cleanNum = certificate.certificateNumber || 'CERT';
      const cleanName = certificate.recipientName.replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Warwick_Certificate_${cleanNum}_${cleanName}.png`;
      await downloadCertificatePng(`${idPrefix}-certificate-container`, filename);
      toast.success('Certificate PNG downloaded successfully!');
    } catch (err: any) {
      console.error('PNG download error:', err);
      toast.error('Failed to download PNG image.');
    } finally {
      setIsDownloadingPng(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!onDelete) return;
    try {
      setIsDeleting(true);
      await onDelete(certificate.id);
      setShowDeleteConfirm(false);
      toast.success(`Certificate ${certificate.certificateNumber} deleted.`);
      onClose();
    } catch (err: any) {
      console.error('Delete error:', err);
      toast.error('Failed to delete certificate.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      id="certificate-view-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm overflow-y-auto animate-fadeIn"
    >
      <div className="relative w-full max-w-6xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[96vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20 shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {certificate.title}
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {certificate.certificateNumber}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Awarded to <strong className="text-slate-800 dark:text-slate-200">{certificate.recipientName}</strong> ({certificate.recipientDepartment || 'Warwick Hotel'})
              </p>
            </div>
          </div>

          {/* Action Buttons Toolbar */}
          <div className="flex items-center gap-2">
            {canPrint && (
              <button
                id="btn-view-modal-print"
                type="button"
                onClick={handlePrint}
                disabled={isPrinting}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition disabled:opacity-50 shadow-xs"
                title={isPreviewMode ? 'Open Printable Preview' : 'Direct Print Certificate'}
              >
                {isPrinting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
                <span>{isPreviewMode ? 'Print Preview' : 'Print'}</span>
              </button>
            )}

            {canSave && (
              <>
                <button
                  id="btn-view-modal-download-pdf"
                  type="button"
                  onClick={handleDownloadPdf}
                  disabled={isDownloadingPdf}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-300 hover:bg-red-100 text-xs font-semibold transition disabled:opacity-50 shadow-xs"
                  title="Download print-grade A4 PDF"
                >
                  {isDownloadingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
                  <span>PDF</span>
                </button>

                <button
                  id="btn-view-modal-download-png"
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={isDownloadingPng}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 hover:bg-amber-100 text-xs font-semibold transition disabled:opacity-50 shadow-xs"
                  title="Download high-resolution PNG image"
                >
                  {isDownloadingPng ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  <span>PNG</span>
                </button>
              </>
            )}

            {canEdit && onEdit && (
              <button
                id="btn-view-modal-edit"
                type="button"
                onClick={() => {
                  onEdit(certificate);
                  onClose();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700/50 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs font-semibold transition"
              >
                <Edit className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>
            )}

            {canDelete && onDelete && (
              <button
                id="btn-view-modal-delete"
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition"
                title="Delete Certificate"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}

            <button
              id="btn-close-view-certificate-modal"
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Banner if active */}
        {showDeleteConfirm && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border-b border-rose-200 dark:border-rose-800 p-4 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-2.5 text-rose-800 dark:text-rose-300 text-xs sm:text-sm font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                Are you sure you want to permanently delete certificate <strong>{certificate.certificateNumber}</strong>? This action cannot be undone.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-600 hover:bg-rose-100 dark:hover:bg-rose-900/40"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="px-4 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {isDeleting && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Yes, Delete Certificate</span>
              </button>
            </div>
          </div>
        )}

        {/* Certificate Display Stage (Responsive, auto-scaling, with zoom controls) */}
        <div className="flex-1 bg-slate-200/80 dark:bg-slate-950 p-4 sm:p-6 overflow-auto min-h-[520px] flex items-center justify-center">
          <CertificatePreviewStage
            cert={certificate}
            idPrefix={idPrefix}
            showToolbar={true}
            onPrintSuccess={() => toast.success('Print job sent.')}
            onDownloadSuccess={() => toast.success('Downloaded successfully.')}
          />
        </div>

        {/* Metadata Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-3">
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Issued on: {new Date(certificate.issuedAt || certificate.createdAt).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              Issued by: {certificate.issuedBy} ({certificate.issuedByRole})
            </span>
            {certificate.customColors && (
              <span className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                <Palette className="w-3.5 h-3.5 text-amber-600" />
                Custom Color Theme Applied
              </span>
            )}
          </div>
          {certificate.notes && (
            <div className="italic text-slate-600 dark:text-slate-300">
              Note: {certificate.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
