import { Router } from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import { db, saveDatabase } from '../../database/json-db.ts';
import { mongoService } from '../../mongodb.ts';
import { addAudit } from '../../utils/audit.helper.ts';
import { actorHasPermission } from '../../middleware/permission.middleware.ts';
import { Certificate, CustomCertificateTemplate } from '../../../src/types.ts';

const router = Router();

const geminiClient = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper to extract & sync recent signatures from a certificate
const saveRecentSignaturesFromCert = async (cert: any) => {
  if (!db.recentSignatures) db.recentSignatures = [];
  const now = new Date().toISOString();
  const sigList = [
    { sig: cert.signatory1Signature, title: cert.signatory1Title || cert.signatoryLeftTitle, name: cert.signatory1Name || cert.signatoryLeftName },
    { sig: cert.signatory2Signature, title: cert.signatory2Title || cert.signatoryRightTitle, name: cert.signatory2Name || cert.signatoryRightName },
    { sig: cert.signatory3Signature, title: cert.signatory3Title || cert.signatoryCenterTitle, name: cert.signatory3Name || cert.signatoryCenterName }
  ];
  let changed = false;
  for (const item of sigList) {
    if (item.sig && typeof item.sig === 'string' && item.sig.length > 50) {
      const existingIdx = db.recentSignatures.findIndex((s: any) => s.dataUrl === item.sig);
      if (existingIdx >= 0) {
        db.recentSignatures[existingIdx].lastUsedAt = now;
        if (item.title) db.recentSignatures[existingIdx].title = item.title;
        if (item.name) db.recentSignatures[existingIdx].name = item.name;
        const rec = db.recentSignatures.splice(existingIdx, 1)[0];
        db.recentSignatures.unshift(rec);
        changed = true;
      } else {
        db.recentSignatures.unshift({
          id: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          dataUrl: item.sig,
          title: item.title || 'Executive Signatory',
          name: item.name || '',
          type: 'digital',
          createdAt: now,
          lastUsedAt: now
        });
        changed = true;
      }
    }
  }
  if (db.recentSignatures.length > 30) {
    db.recentSignatures = db.recentSignatures.slice(0, 30);
  }
  if (changed) {
    saveDatabase();
  }
};

// ----------------------------------------------------
// Certificate Templates
// ----------------------------------------------------
router.get('/templates', (req, res) => {
  return res.json({
    success: true,
    templates: db.certificateTemplates || []
  });
});

router.post('/templates', async (req, res) => {
  const role = ((req.headers['x-user-role'] as string) || 'Admin').trim().toLowerCase();
  const isAllowedRole = ['super admin', 'admin'].includes(role) || actorHasPermission(req, 'certificates_create');
  if (!isAllowedRole) {
    return res.status(403).json({ error: 'Access denied. You do not have permission to create certificate templates.' });
  }

  try {
    const {
      id: providedId,
      name,
      description,
      category,
      backgroundImageUrl,
      textMode,
      textColor,
      accentColor,
      nameOffsetY,
      nameFontSize,
      citationOffsetY,
      defaultTitle,
      defaultCitation,
      elements,
      settings,
      thumbnailBadge
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Template name is required.' });
    }

    const newTemplate: any = {
      id: providedId || `tpl-custom-${Date.now()}`,
      name: name.trim(),
      description: (description || '').trim(),
      category: (category || 'Special Award').trim(),
      backgroundImageUrl: backgroundImageUrl || '',
      isCustom: true,
      defaultTitle: (defaultTitle || name).trim(),
      defaultCitation: (defaultCitation || '').trim(),
      textMode: textMode === 'fill_in_blanks' ? 'fill_in_blanks' : 'full',
      textColor: textColor || '#1a2e40',
      accentColor: accentColor || '#c4972a',
      nameOffsetY: typeof nameOffsetY === 'number' ? nameOffsetY : 48,
      nameFontSize: typeof nameFontSize === 'number' ? nameFontSize : 36,
      citationOffsetY: typeof citationOffsetY === 'number' ? citationOffsetY : 60,
      elements: elements || [],
      settings: settings || {},
      thumbnailBadge: thumbnailBadge || 'CUSTOM',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: (req.headers['x-user-name'] as string) || 'Admin'
    };

    db.certificateTemplates = db.certificateTemplates || [];
    db.certificateTemplates.unshift(newTemplate);
    saveDatabase();

    return res.status(201).json({
      success: true,
      message: 'Certificate template saved and added successfully.',
      template: newTemplate
    });
  } catch (err: any) {
    console.error('Error adding template:', err);
    return res.status(500).json({ error: err.message || 'Failed to add certificate template' });
  }
});

router.put('/templates/:id', async (req, res) => {
  const actor = (req.headers['x-user-name'] as string) || 'Admin';
  const role = ((req.headers['x-user-role'] as string) || 'Admin').trim().toLowerCase();
  const isAllowed = ['super admin', 'admin'].includes(role) || actorHasPermission(req, 'certificates_edit');
  if (!isAllowed) {
    return res.status(403).json({ error: 'Access denied. You do not have permission to edit certificate templates.' });
  }

  const { id } = req.params;
  db.certificateTemplates = db.certificateTemplates || [];
  const idx = db.certificateTemplates.findIndex(t => t.id === id);
  if (idx === -1) {
    const newCustom: any = {
      id,
      name: req.body.name || 'Customized Template',
      description: req.body.description || '',
      category: req.body.category || 'Special Award',
      backgroundImageUrl: req.body.backgroundImageUrl || '',
      isCustom: true,
      defaultTitle: req.body.defaultTitle,
      defaultCitation: req.body.defaultCitation,
      textMode: req.body.textMode || 'full',
      textColor: req.body.textColor,
      accentColor: req.body.accentColor,
      nameOffsetY: req.body.nameOffsetY,
      nameFontSize: req.body.nameFontSize,
      citationOffsetY: req.body.citationOffsetY,
      customColors: req.body.customColors,
      layoutCoordinates: req.body.layoutCoordinates,
      elements: req.body.elements || [],
      settings: req.body.settings || {},
      thumbnailBadge: req.body.thumbnailBadge || 'CUSTOM',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: actor
    };
    db.certificateTemplates.push(newCustom);
    saveDatabase();
    return res.json({ success: true, message: 'Template saved.', template: newCustom });
  }

  db.certificateTemplates[idx] = {
    ...db.certificateTemplates[idx],
    ...req.body,
    id,
    updatedAt: new Date().toISOString()
  };
  saveDatabase();

  return res.json({
    success: true,
    message: 'Certificate template updated successfully.',
    template: db.certificateTemplates[idx]
  });
});

router.delete('/templates/:id', async (req, res) => {
  const role = ((req.headers['x-user-role'] as string) || 'Admin').trim().toLowerCase();
  const isAllowedRole = ['super admin', 'admin'].includes(role) || actorHasPermission(req, 'certificates_delete');
  if (!isAllowedRole) {
    return res.status(403).json({ error: 'Access denied. You do not have permission to delete certificate templates. Supervisors and Managers cannot delete templates.' });
  }

  const { id } = req.params;
  db.certificateTemplates = (db.certificateTemplates || []).filter(t => t.id !== id);
  saveDatabase();

  return res.json({
    success: true,
    message: 'Certificate template removed.'
  });
});

// ----------------------------------------------------
// Recent Signatures
// ----------------------------------------------------
router.get('/signatures/recent', (req, res) => {
  if (!db.recentSignatures) {
    db.recentSignatures = [];
    (db.certificates || []).forEach((c: any) => {
      if (c.signatory1Signature && c.signatory1Signature.length > 50) {
        db.recentSignatures.push({
          id: `sig-cert-${c.id}-1`,
          dataUrl: c.signatory1Signature,
          title: c.signatory1Title || c.signatoryLeftTitle || 'Left Signatory',
          name: c.signatory1Name || c.signatoryLeftName || '',
          type: 'digital',
          createdAt: c.createdAt || new Date().toISOString(),
          lastUsedAt: c.createdAt || new Date().toISOString()
        });
      }
      if (c.signatory2Signature && c.signatory2Signature.length > 50) {
        db.recentSignatures.push({
          id: `sig-cert-${c.id}-2`,
          dataUrl: c.signatory2Signature,
          title: c.signatory2Title || c.signatoryRightTitle || 'Right Signatory',
          name: c.signatory2Name || c.signatoryRightName || '',
          type: 'digital',
          createdAt: c.createdAt || new Date().toISOString(),
          lastUsedAt: c.createdAt || new Date().toISOString()
        });
      }
    });
  }
  return res.json({ success: true, signatures: db.recentSignatures });
});

router.post('/signatures/recent', async (req, res) => {
  try {
    const { dataUrl, title, name, type } = req.body;
    if (!dataUrl) return res.status(400).json({ error: 'dataUrl required' });
    if (!db.recentSignatures) db.recentSignatures = [];

    const existingIdx = db.recentSignatures.findIndex((s: any) => s.dataUrl === dataUrl);
    const now = new Date().toISOString();
    let record: any;
    if (existingIdx >= 0) {
      db.recentSignatures[existingIdx].lastUsedAt = now;
      if (title) db.recentSignatures[existingIdx].title = title;
      if (name) db.recentSignatures[existingIdx].name = name;
      record = db.recentSignatures.splice(existingIdx, 1)[0];
      db.recentSignatures.unshift(record);
    } else {
      record = {
        id: `sig-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        dataUrl,
        title: title || 'Executive Signatory',
        name: name || '',
        type: type || 'digital',
        createdAt: now,
        lastUsedAt: now
      };
      db.recentSignatures.unshift(record);
    }
    if (db.recentSignatures.length > 30) {
      db.recentSignatures = db.recentSignatures.slice(0, 30);
    }
    saveDatabase();
    return res.json({ success: true, signature: record, signatures: db.recentSignatures });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

router.delete('/signatures/recent/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!db.recentSignatures) db.recentSignatures = [];
    db.recentSignatures = db.recentSignatures.filter((s: any) => s.id !== id);
    saveDatabase();
    return res.json({ success: true, message: 'Signature removed from recent history.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// AI Signature Extraction
router.post('/extract-signature', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return res.status(400).json({
        success: false,
        hasHandwrittenSignature: false,
        error: 'Handwritten signature is not found',
        message: 'Handwritten signature is not found'
      });
    }

    const match = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    let mimeType = 'image/jpeg';
    let rawBase64 = imageBase64;
    if (match) {
      mimeType = match[1];
      rawBase64 = match[2];
    }

    if (process.env.GEMINI_API_KEY) {
      try {
        const prompt = `You are an expert forensic document analyst and handwritten signature extraction specialist.

TASK & CONTEXT:
The user has uploaded a photo, scanned page, agreement, certificate, or document containing a mix of computer-typed / machine-printed text and handwritten human signatures.

CRITICAL DISTINCTION:
1. Computer-Typed / Machine-Printed Text:
   - Uniform font typography (Arial, Times New Roman, Calibri, Roboto, etc.), rigid geometry, printed letterforms, barcodes, stamps, labels (e.g. "Authorized Signature", "Approved by", "Date", names).
2. Human Handwritten Signature / Ink Strokes:
   - Freehand curves, looping cursive or script pen strokes, flourish marks, variable line thickness, ink pressure variations from a pen, ballpoint, ink fountain, pencil, or stylus.
   - Often signed on top of, near, or above a printed signatory line.

CORE CLASSIFICATION RULE:
- Documents and certificate pages ALMOST ALWAYS contain significant computer-typed text.
- If you find ANY human handwritten signature, initials, or pen ink marks anywhere on the document:
  hasHandwrittenSignature MUST BE TRUE! DO NOT mark as false just because the document has computer text!
- If the image contains ONLY computer-printed digital text with ZERO handwriting, OR is an unrelated non-document photo (e.g., landscape, vehicle):
  hasHandwrittenSignature = false, and explain in "reason".

BOUNDING BOX & COMPUTER TEXT REMOVAL RULES:
1. Provide normalized coordinates [ymin, xmin, ymax, xmax] on a scale of 0 to 1000.
2. The boundingBox must crop TIGHTLY and EXCLUSIVELY to the human handwritten ink strokes!
3. CRITICAL: EXCLUDE all computer-typed text (such as "Authorized Signatory", "Signature:", names, titles, body text) from the bounding box!
4. CRITICAL: EXCLUDE horizontal dotted or solid printed form lines.
5. If there are multiple handwritten signatures on the page, provide the primary one in boundingBox, and list every detected signature in allSignatures with friendly labels (e.g., "Left Signatory", "Right Signatory", "Authorized Signature").`;

        let parsed: any = null;
        const candidateModels = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
        for (const modelName of candidateModels) {
          try {
            const response = await geminiClient.models.generateContent({
              model: modelName,
              contents: [
                {
                  inlineData: {
                    mimeType,
                    data: rawBase64
                  }
                },
                {
                  text: prompt
                }
              ],
              config: {
                responseMimeType: 'application/json',
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    hasHandwrittenSignature: {
                      type: Type.BOOLEAN,
                      description: 'True if at least one human handwritten ink signature or initials is found on the document, false if strictly machine text or non-signature.'
                    },
                    confidence: {
                      type: Type.NUMBER,
                      description: 'Confidence score between 0 and 1'
                    },
                    reason: {
                      type: Type.STRING,
                      description: 'Forensic explanation of handwriting presence and computer text separation'
                    },
                    boundingBox: {
                      type: Type.OBJECT,
                      description: 'Normalized bounding box [0-1000] enclosing ONLY the handwritten ink signature, excluding machine text',
                      properties: {
                        ymin: { type: Type.INTEGER },
                        xmin: { type: Type.INTEGER },
                        ymax: { type: Type.INTEGER },
                        xmax: { type: Type.INTEGER }
                      },
                      required: ['ymin', 'xmin', 'ymax', 'xmax']
                    },
                    allSignatures: {
                      type: Type.ARRAY,
                      description: 'List of all detected handwritten signatures if there are multiple on the document',
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          ymin: { type: Type.INTEGER },
                          xmin: { type: Type.INTEGER },
                          ymax: { type: Type.INTEGER },
                          xmax: { type: Type.INTEGER }
                        },
                        required: ['ymin', 'xmin', 'ymax', 'xmax']
                      }
                    }
                  },
                  required: ['hasHandwrittenSignature', 'reason']
                }
              }
            });

            const resultText = response.text?.trim() || '{}';
            parsed = JSON.parse(resultText);
            if (parsed) break;
          } catch (modelErr: any) {
            console.warn(`Attempt with ${modelName} encountered:`, modelErr?.message || modelErr);
          }
        }

        if (parsed) {
          if (!parsed.hasHandwrittenSignature) {
            return res.json({
              success: false,
              hasHandwrittenSignature: false,
              error: 'Handwritten signature is not found',
              message: 'Handwritten signature is not found',
              reason: parsed.reason || 'No authentic pen-written signature was identified in the document.'
            });
          }

          return res.json({
            success: true,
            hasHandwrittenSignature: true,
            boundingBox: parsed.boundingBox,
            allSignatures: parsed.allSignatures || (parsed.boundingBox ? [parsed.boundingBox] : []),
            confidence: parsed.confidence ?? 0.95,
            message: 'Handwritten signature successfully detected and isolated.',
            reason: parsed.reason
          });
        }

        return res.json({
          success: true,
          hasHandwrittenSignature: true,
          confidence: 0.85,
          message: 'Signature loaded successfully. Use the crop tool to select the signature.',
          reason: 'Fallback signature extraction mode enabled.'
        });
      } catch (geminiErr: any) {
        console.warn('Gemini handwriting verification error:', geminiErr?.message || geminiErr);
        return res.json({
          success: true,
          hasHandwrittenSignature: true,
          confidence: 0.8,
          message: 'Signature loaded. Use the crop tool to select the signature area.',
          reason: 'Fallback signature processing.'
        });
      }
    }

    return res.json({
      success: true,
      hasHandwrittenSignature: true,
      confidence: 0.8,
      message: 'Signature loaded. Use the crop tool to select the signature area.',
      reason: 'Manual signature cropping active.'
    });
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      hasHandwrittenSignature: false,
      error: 'Failed to verify signature',
      message: 'Handwritten signature is not found'
    });
  }
});

// ----------------------------------------------------
// Certificates CRUD
// ----------------------------------------------------
router.get('/', async (req, res) => {
  const userRole = ((req.headers['x-user-role'] as string) || '').trim().toLowerCase();
  const isAllowedRole = userRole === 'super admin' || actorHasPermission(req, 'certificates_view') || actorHasPermission(req, 'certificates');
  if (!isAllowedRole) {
    return res.status(403).json({ error: 'Access denied. You do not have permission to view certificates.' });
  }

  if (mongoService.isLive) {
    try {
      const mongoCerts = await mongoService.getCertificates();
      if (mongoCerts && mongoCerts.length > 0) {
        db.certificates = mongoCerts;
      }
    } catch (e) {
      console.warn('[MongoDB] getCertificates error:', e);
    }
  }

  let certs = [...(db.certificates || [])];
  const q = (req.query.q as string || '').toLowerCase().trim();
  const template = (req.query.template as string || '').trim();

  if (q) {
    certs = certs.filter(c => 
      (c.recipientName && c.recipientName.toLowerCase().includes(q)) ||
      (c.certificateNumber && c.certificateNumber.toLowerCase().includes(q)) ||
      (c.title && c.title.toLowerCase().includes(q)) ||
      (c.recipientDepartment && c.recipientDepartment.toLowerCase().includes(q)) ||
      (c.awardPeriod && c.awardPeriod.toLowerCase().includes(q))
    );
  }

  if (template && template !== 'all') {
    certs = certs.filter(c => c.template === template);
  }

  certs.sort((a, b) => new Date(b.issuedAt || b.createdAt).getTime() - new Date(a.issuedAt || a.createdAt).getTime());

  return res.json({
    success: true,
    certificates: certs,
    total: certs.length,
    source: mongoService.isLive ? 'mongodb' : 'local'
  });
});

router.get('/:id', (req, res) => {
  const { id } = req.params;
  const cert = (db.certificates || []).find(c => c.id === id || c.certificateNumber === id);
  if (!cert) {
    return res.status(404).json({ error: 'Certificate not found' });
  }
  return res.json({ success: true, certificate: cert });
});

router.post('/', async (req, res) => {
  const actor = (req.headers['x-user-name'] as string) || 'MD ABU SAYEED RIDAY';
  const role = (req.headers['x-user-role'] as string) || 'Super Admin';

  const roleLower = role.trim().toLowerCase();
  const isAllowedRole = ['super admin', 'admin'].includes(roleLower) || actorHasPermission(req, 'certificates_create');
  if (!isAllowedRole) {
    return res.status(403).json({ error: 'Access denied. You do not have permission to generate certificates.' });
  }

  try {
    const body = req.body;
    const count = (db.certificates || []).length + 1;
    const year = new Date().getFullYear();
    const paddedNum = String(count).padStart(3, '0');
    const certNumber = body.certificateNumber || `WRW-CERT-${year}-${paddedNum}`;

    const newCert: Certificate = {
      ...body,
      id: body.id || `cert-${Date.now()}`,
      certificateNumber: certNumber,
      template: body.template || 'employee_of_month',
      customTemplateId: body.customTemplateId || undefined,
      customBackgroundImage: body.customBackgroundImage || undefined,
      customColors: body.customColors || undefined,
      textMode: body.textMode || 'full',
      nameOffsetY: typeof body.nameOffsetY === 'number' ? body.nameOffsetY : undefined,
      nameFontSize: typeof body.nameFontSize === 'number' ? body.nameFontSize : undefined,
      title: body.title || (body.template === 'appreciation' ? 'Certificate of Appreciation' : 'Employee of the Month'),
      presentationText: body.presentationText || 'THIS CERTIFICATE IS PROUDLY PRESENTED TO',
      recipientName: (body.recipientName || '').trim() || 'MD ABU SAYEED RIDAY',
      recipientStaffId: body.recipientStaffId || undefined,
      recipientPosition: (body.recipientPosition || '').trim() || (body.template === 'appreciation' ? 'Housekeeping Supervisor' : 'Housekeeping'),
      recipientDepartment: (body.recipientDepartment || '').trim() || 'Housekeeping',
      awardPeriod: (body.awardPeriod || '').trim() || 'June 2026',
      citationText: (body.citationText || '').trim(),
      citationAlignment: body.citationAlignment || 'center',
      citationFontSize: typeof body.citationFontSize === 'number' ? body.citationFontSize : 14,
      location: (body.location || '').trim() || 'Al Baha, Saudi Arabia',
      awardDate: (body.awardDate || '').trim() || new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
      signatory1Title: (body.signatory1Title || '').trim() || (body.template === 'appreciation' ? 'Housekeeping Manager' : 'Housekeeping'),
      signatory1Name: (body.signatory1Name || '').trim(),
      signatory1Signature: body.signatory1Signature || undefined,
      signatory2Title: (body.signatory2Title || '').trim() || 'General Manager',
      signatory2Name: (body.signatory2Name || '').trim(),
      signatory2Signature: body.signatory2Signature || undefined,
      signatory3Title: (body.signatory3Title || '').trim() || undefined,
      signatory3Name: (body.signatory3Name || '').trim() || undefined,
      signatory3Signature: body.signatory3Signature || undefined,
      showSignatory3: Boolean(body.showSignatory3),
      notes: (body.notes || '').trim() || undefined,
      hotelName: body.hotelName !== undefined ? body.hotelName : (body.showHotelBranding === false ? '' : 'WARWICK'),
      hotelSubtitle: body.hotelSubtitle !== undefined ? body.hotelSubtitle : (body.showHotelBranding === false ? '' : 'HOTEL AL BAHA • HOTELS & RESORTS'),
      hotelLogoUrl: body.hotelLogoUrl || undefined,
      hotelLogoPreset: body.hotelLogoPreset || 'warwick_crest',
      hotelLogoSize: typeof body.hotelLogoSize === 'number' ? body.hotelLogoSize : 48,
      showHotelLogo: body.showHotelLogo !== false,
      showHotelBranding: body.showHotelBranding !== false,
      showFiveStars: body.showFiveStars !== false,
      showBadge: body.showBadge !== false,
      badgeStyle: body.badgeStyle || 'rosette',
      badgeText: body.badgeText || 'SEAL OF EXCELLENCE',
      badgeSubtext: body.badgeSubtext || '5-STAR LUXURY',
      borderStyle: body.borderStyle || 'royal_frame',
      fontFamilyChoice: body.fontFamilyChoice || 'serif',
      showWatermark: body.showWatermark !== false,
      issuedBy: actor,
      issuedByRole: role,
      issuedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!newCert.citationText) {
      if (newCert.template === 'appreciation') {
        newCert.citationText = `This certificate is proudly presented to ${newCert.recipientName}, ${newCert.recipientPosition}, in recognition of your exceptional dedication, leadership, and hard work during the successful opening of our hotel. Your professionalism, commitment, and valuable contribution played an important role in achieving this memorable milestone and will always be sincerely appreciated.`;
      } else if (newCert.template === 'employee_of_month') {
        newCert.citationText = 'For outstanding dedication, hard work, and excellent performance. Your commitment and positive contribution to the team are truly appreciated. Congratulations on being selected as Employee of the Month!';
      } else {
        newCert.citationText = 'In recognition of outstanding dedication, exemplary professional contribution, and commitment to excellence at Warwick Hotel Baha.';
      }
    }

    db.certificates = db.certificates || [];
    db.certificates.unshift(newCert);
    saveDatabase();
    await saveRecentSignaturesFromCert(newCert);

    if (mongoService.isLive) {
      await mongoService.upsertCertificate(newCert).catch(err => {
        console.warn('[MongoDB] Save certificate to mongo error:', err);
      });
    }

    await addAudit(
      'Certificate Issued',
      'certificate',
      `Issued "${newCert.title}" to ${newCert.recipientName} (${newCert.recipientDepartment || 'Staff'}) by ${actor}`,
      actor,
      role as any,
      newCert.id,
      { actionType: 'certificate' }
    );

    return res.status(201).json({
      success: true,
      message: 'Certificate generated and added to history successfully.',
      certificate: newCert
    });
  } catch (err: any) {
    console.error('Error generating certificate:', err);
    return res.status(500).json({ error: err.message || 'Failed to generate certificate' });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const actor = (req.headers['x-user-name'] as string) || 'Admin';
  const role = ((req.headers['x-user-role'] as string) || 'Admin').trim().toLowerCase();
  const isAllowedRole = ['super admin', 'admin'].includes(role) || actorHasPermission(req, 'certificates_edit');
  if (!isAllowedRole) {
    return res.status(403).json({ error: 'Access denied. You do not have permission to modify certificates.' });
  }

  const index = (db.certificates || []).findIndex(c => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Certificate not found' });
  }

  const updatedCert: Certificate = {
    ...db.certificates[index],
    ...req.body,
    id: db.certificates[index].id,
    certificateNumber: db.certificates[index].certificateNumber,
    updatedAt: new Date().toISOString()
  };

  db.certificates[index] = updatedCert;
  saveDatabase();
  await saveRecentSignaturesFromCert(updatedCert);

  if (mongoService.isLive) {
    await mongoService.upsertCertificate(updatedCert).catch(err => {
      console.warn('[MongoDB] Update certificate in mongo error:', err);
    });
  }

  await addAudit(
    'Certificate Updated',
    'certificate',
    `Updated certificate "${updatedCert.title}" for ${updatedCert.recipientName} by ${actor}`,
    actor,
    role as any,
    id,
    { actionType: 'certificate' }
  );

  return res.json({
    success: true,
    message: 'Certificate updated successfully.',
    certificate: updatedCert
  });
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  const actor = (req.headers['x-user-name'] as string) || 'Admin';
  const role = ((req.headers['x-user-role'] as string) || 'Admin').trim().toLowerCase();
  const isAllowedRole = ['super admin', 'admin'].includes(role) || actorHasPermission(req, 'certificates_delete');
  if (!isAllowedRole) {
    return res.status(403).json({ error: 'Access denied. You do not have permission to delete certificates. Supervisors and Managers cannot delete certificates.' });
  }

  const certToDelete = (db.certificates || []).find(c => c.id === id || c.certificateNumber === id);
  const certTitle = certToDelete?.title || 'Certificate';
  const recipientName = certToDelete?.recipientName || id;

  db.certificates = (db.certificates || []).filter(c => c.id !== id && c.certificateNumber !== id);
  saveDatabase();

  if (mongoService.isLive) {
    await mongoService.deleteCertificate(id).catch(err => {
      console.warn('[MongoDB] Delete certificate in mongo error:', err);
    });
  }

  await addAudit(
    'Certificate Revoked/Deleted',
    'certificate',
    `Deleted certificate record "${certTitle}" for ${recipientName} by ${actor}`,
    actor,
    role as any,
    id,
    { actionType: 'certificate' }
  );

  return res.json({
    success: true,
    message: 'Certificate deleted from history successfully.'
  });
});

export default router;
