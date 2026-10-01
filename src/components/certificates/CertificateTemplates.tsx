import React, { forwardRef } from 'react';
import { Certificate } from '../../types';

// Re-export individual templates from modular files
export { EmployeeOfTheMonthCertificate } from './templates/EmployeeOfTheMonthCertificate';
export { AppreciationCertificate } from './templates/AppreciationCertificate';
export { StarLeadershipCertificate } from './templates/StarLeadershipCertificate';
export { StarHospitalityCertificate } from './templates/StarHospitalityCertificate';
export { StarMilestoneCertificate } from './templates/StarMilestoneCertificate';
export { StarMasteryCertificate } from './templates/StarMasteryCertificate';
export { CustomImageCertificate } from './templates/CustomImageCertificate';
export { HotelLogoDisplay } from './HotelLogoDisplay';
export { CertificateSealMedal } from './CertificateSealMedal';

import { EmployeeOfTheMonthCertificate } from './templates/EmployeeOfTheMonthCertificate';
import { AppreciationCertificate } from './templates/AppreciationCertificate';
import { StarLeadershipCertificate } from './templates/StarLeadershipCertificate';
import { StarHospitalityCertificate } from './templates/StarHospitalityCertificate';
import { StarMilestoneCertificate } from './templates/StarMilestoneCertificate';
import { StarMasteryCertificate } from './templates/StarMasteryCertificate';
import { CustomImageCertificate } from './templates/CustomImageCertificate';
import { HotelPresetUniqueCertificate } from './templates/HotelPresetUniqueCertificate';

export { HotelPresetUniqueCertificate } from './templates/HotelPresetUniqueCertificate';

export interface CertificateTemplateProps {
  cert: Partial<Certificate>;
  idPrefix?: string;
  className?: string;
}

/**
 * Universal Certificate Renderer: automatically routes to any of the
 * 25 Five-Star luxury hotel templates or custom uploaded picture template.
 */
export const CertificateRenderer = forwardRef<HTMLDivElement, CertificateTemplateProps>(
  ({ cert, idPrefix, className = '' }, ref) => {
    // 1. Custom uploaded background picture
    if (
      cert.customBackgroundImage ||
      cert.template === 'custom' ||
      (cert.template && cert.template.startsWith('tpl-custom-'))
    ) {
      return (
        <CustomImageCertificate
          ref={ref}
          cert={cert}
          idPrefix={idPrefix || 'custom'}
          className={className}
        />
      );
    }

    // 2. Standard Templates (Always routes directly to the chosen template)
    switch (cert.template) {
      case 'employee_of_month':
      case 'star_eom':
        return (
          <EmployeeOfTheMonthCertificate
            ref={ref}
            cert={cert}
            idPrefix={idPrefix || 'eom'}
            className={className}
          />
        );

      case 'appreciation':
      case 'star_appreciation':
        return (
          <AppreciationCertificate
            ref={ref}
            cert={cert}
            idPrefix={idPrefix || 'app'}
            className={className}
          />
        );

      case 'star_leadership':
        return (
          <StarLeadershipCertificate
            ref={ref}
            cert={cert}
            idPrefix={idPrefix || 'lead'}
            className={className}
          />
        );

      case 'star_hospitality':
        return (
          <StarHospitalityCertificate
            ref={ref}
            cert={cert}
            idPrefix={idPrefix || 'hosp'}
            className={className}
          />
        );

      case 'star_milestone':
        return (
          <StarMilestoneCertificate
            ref={ref}
            cert={cert}
            idPrefix={idPrefix || 'mile'}
            className={className}
          />
        );

      case 'star_mastery':
        return (
          <StarMasteryCertificate
            ref={ref}
            cert={cert}
            idPrefix={idPrefix || 'mast'}
            className={className}
          />
        );

      default:
        // 3. Hotel Staff Presets (hotel-staff-1 through hotel-staff-25) or custom element builder
        return (
          <HotelPresetUniqueCertificate
            ref={ref}
            cert={cert}
            idPrefix={idPrefix || 'preset-uniq'}
            className={className}
          />
        );
    }
  }
);

CertificateRenderer.displayName = 'CertificateRenderer';
