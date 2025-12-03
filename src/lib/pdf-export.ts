import jsPDF from 'jspdf';

export interface ExportOptions {
  includeWatermark?: boolean;
  includeDisclaimer?: boolean;
  removeSensitiveData?: boolean;
  includeMood?: boolean;
  includeTags?: boolean;
  includeDate?: boolean;
  includeAIInsights?: boolean;
}

export interface ExportHistory {
  id: string;
  type: 'single' | 'multiple' | 'date_range';
  entryCount: number;
  exportedAt: string;
  fileName: string;
  options: ExportOptions;
}

export class PDFExporter {
  private static instance: PDFExporter;
  private exportHistory: ExportHistory[] = [];

  static getInstance(): PDFExporter {
    if (!PDFExporter.instance) {
      PDFExporter.instance = new PDFExporter();
    }
    return PDFExporter.instance;
  }

  private removeSensitiveData(content: string): string {
    // Remove common sensitive patterns
    const sensitivePatterns = [
      /\b\d{3}-\d{2}-\d{4}\b/g, // SSN pattern
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, // Credit card pattern
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email pattern
      /\b\d{10}\b/g, // Phone number pattern
    ];

    let cleanedContent = content;
    sensitivePatterns.forEach(pattern => {
      cleanedContent = cleanedContent.replace(pattern, '[REDACTED]');
    });

    // Remove names (simple heuristic)
    const nameWords = content.split(' ').filter(word => 
      word.length > 2 && /^[A-Z][a-z]+$/.test(word)
    );
    nameWords.forEach(name => {
      const regex = new RegExp(`\\b${name}\\b`, 'g');
      cleanedContent = cleanedContent.replace(regex, '[NAME]');
    });

    return cleanedContent;
  }

  private addWatermark(doc: jsPDF): void {
    doc.setFontSize(48);
    doc.setTextColor(200, 200, 200);
    doc.text('Personal Journal - Confidential', 105, 150, { 
      angle: 45, 
      align: 'center'
    });
  }

  private addDisclaimer(doc: jsPDF, yPosition: number): number {
    const disclaimer = 'This document contains personal journal entries and is confidential. It is intended for personal use only. Any unauthorized distribution is prohibited.';
    
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    const lines = doc.splitTextToSize(disclaimer, 180);
    lines.forEach((line: string) => {
      doc.text(line, 15, yPosition);
      yPosition += 5;
    });
    
    return yPosition + 10;
  }

  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  async exportSingleEntry(
    entry: any,
    options: ExportOptions = {},
    isPreview: boolean = false
  ): Promise<{ blob: Blob; fileName: string }> {
    const doc = new jsPDF();
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;

    // Add watermark if requested
    if (options.includeWatermark) {
      this.addWatermark(doc);
    }

    // Title
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 37, 41);
    const title = entry.title || 'Untitled Entry';
    doc.text(title, margin, yPosition);
    yPosition += 15;

    // Date
    if (options.includeDate !== false) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(108, 117, 125);
      doc.text(`Date: ${this.formatDate(entry.created_at)}`, margin, yPosition);
      yPosition += 10;
    }

    // Mood
    if (options.includeMood !== false && entry.mood) {
      doc.setFontSize(12);
      doc.text(`Mood: ${entry.mood}`, margin, yPosition);
      yPosition += 10;
    }

    // Tags
    if (options.includeTags !== false && entry.tags && entry.tags.length > 0) {
      doc.setFontSize(12);
      doc.text(`Tags: ${entry.tags.join(', ')}`, margin, yPosition);
      yPosition += 10;
    }

    yPosition += 10;

    // Content
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(33, 37, 41);
    
    let content = entry.content;
    if (options.removeSensitiveData) {
      content = this.removeSensitiveData(content);
    }

    const lines = doc.splitTextToSize(content, 180);
    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 40) {
        doc.addPage();
        yPosition = 20;
        if (options.includeWatermark) {
          this.addWatermark(doc);
        }
      }
      doc.text(line, margin, yPosition);
      yPosition += 7;
    });

    // Add disclaimer if requested
    if (options.includeDisclaimer) {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        yPosition = 20;
      }
      this.addDisclaimer(doc, pageHeight - 20);
    }

    // Generate filename
    const date = new Date(entry.created_at).toISOString().split('T')[0];
    const fileName = `journal-${date}-${entry.id.substring(0, 8)}.pdf`;

    // Add to export history
    if (!isPreview) {
      this.addToExportHistory('single', 1, fileName, options);
    }

    return { blob: doc.output('blob'), fileName };
  }

  async exportMultipleEntries(
    entries: any[],
    options: ExportOptions = {},
    isPreview: boolean = false,
    aiInsights?: any
  ): Promise<{ blob: Blob; fileName: string }> {
    const doc = new jsPDF();
    let currentPage = 1;
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;

    // Title page
    if (options.includeWatermark) {
      this.addWatermark(doc);
    }
    
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 37, 41);
    doc.text('Journal Entries Export', margin, yPosition);
    yPosition += 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(108, 117, 125);
    doc.text(`Total Entries: ${entries.length}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Export Date: ${this.formatDate(new Date().toISOString())}`, margin, yPosition);
    yPosition += 20;

    // Table of contents
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Table of Contents', margin, yPosition);
    yPosition += 15;

    entries.forEach((entry, index) => {
      if (yPosition > pageHeight - 30) {
        doc.addPage();
        currentPage++;
        yPosition = 20;
        if (options.includeWatermark) {
          this.addWatermark(doc);
        }
      }
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      const title = entry.title || `Entry ${index + 1}`;
      const date = this.formatDate(entry.created_at);
      doc.text(`${index + 1}. ${title} - ${date}`, margin, yPosition);
      yPosition += 8;
    });

    // Add AI Insights section if available and requested
    if (options.includeAIInsights && aiInsights) {
      console.log('PDF Export Debug - Adding AI Insights (Multiple):', aiInsights);
      
      doc.addPage();
      currentPage++;
      yPosition = 20;
      
      if (options.includeWatermark) {
        this.addWatermark(doc);
      }

      // AI Insights Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(33, 37, 41);
      doc.text('AI Weekly Insights', margin, yPosition);
      yPosition += 20;

      // Emotional State
      if (aiInsights.emotionalState) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Emotional State', margin, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(108, 117, 125);
        const emotionalLines = doc.splitTextToSize(aiInsights.emotionalState, 180);
        emotionalLines.forEach((line: string) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            currentPage++;
            yPosition = 20;
            if (options.includeWatermark) {
              this.addWatermark(doc);
            }
          }
          doc.text(line, margin, yPosition);
          yPosition += 7;
        });
        yPosition += 10;
      }

      // Patterns
      if (aiInsights.patterns && aiInsights.patterns.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(33, 37, 41);
        doc.text('Patterns Identified', margin, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(108, 117, 125);
        aiInsights.patterns.forEach((pattern: string) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            currentPage++;
            yPosition = 20;
            if (options.includeWatermark) {
              this.addWatermark(doc);
            }
          }
          const patternLines = doc.splitTextToSize(`• ${pattern}`, 180);
          patternLines.forEach((line: string) => {
            doc.text(line, margin, yPosition);
            yPosition += 7;
          });
        });
        yPosition += 10;
      }

      // Recommendations
      if (aiInsights.recommendations && aiInsights.recommendations.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(33, 37, 41);
        doc.text('Recommendations', margin, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(108, 117, 125);
        aiInsights.recommendations.forEach((recommendation: string) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            currentPage++;
            yPosition = 20;
            if (options.includeWatermark) {
              this.addWatermark(doc);
            }
          }
          const recLines = doc.splitTextToSize(`• ${recommendation}`, 180);
          recLines.forEach((line: string) => {
            doc.text(line, margin, yPosition);
            yPosition += 7;
          });
        });
        yPosition += 10;
      }

      // Top Themes
      if (aiInsights.topThemes && aiInsights.topThemes.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(33, 37, 41);
        doc.text('Top Themes', margin, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(108, 117, 125);
        aiInsights.topThemes.forEach((theme: string) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            currentPage++;
            yPosition = 20;
            if (options.includeWatermark) {
              this.addWatermark(doc);
            }
          }
          doc.text(`• ${theme}`, margin, yPosition);
          yPosition += 7;
        });
        yPosition += 10;
      }

      // Summary
      if (aiInsights.summary) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(33, 37, 41);
        doc.text('Summary', margin, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(108, 117, 125);
        const summaryLines = doc.splitTextToSize(aiInsights.summary, 180);
        summaryLines.forEach((line: string) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            currentPage++;
            yPosition = 20;
            if (options.includeWatermark) {
              this.addWatermark(doc);
            }
          }
          doc.text(line, margin, yPosition);
          yPosition += 7;
        });
      }
    }

    // Add entries
    entries.forEach((entry, index) => {
      doc.addPage();
      currentPage++;
      yPosition = 20;
      
      if (options.includeWatermark) {
        this.addWatermark(doc);
      }

      // Entry header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(33, 37, 41);
      const title = entry.title || `Entry ${index + 1}`;
      doc.text(`${index + 1}. ${title}`, margin, yPosition);
      yPosition += 15;

      // Entry metadata
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(108, 117, 125);
      
      if (options.includeDate !== false) {
        doc.text(`Date: ${this.formatDate(entry.created_at)}`, margin, yPosition);
        yPosition += 8;
      }
      
      if (options.includeMood !== false && entry.mood) {
        doc.text(`Mood: ${entry.mood}`, margin, yPosition);
        yPosition += 8;
      }
      
      if (options.includeTags !== false && entry.tags && entry.tags.length > 0) {
        doc.text(`Tags: ${entry.tags.join(', ')}`, margin, yPosition);
        yPosition += 8;
      }

      yPosition += 10;

      // Entry content
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 37, 41);
      
      let content = entry.content;
      if (options.removeSensitiveData) {
        content = this.removeSensitiveData(content);
      }

      const lines = doc.splitTextToSize(content, 180);
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          currentPage++;
          yPosition = 20;
          if (options.includeWatermark) {
            this.addWatermark(doc);
          }
        }
        doc.text(line, margin, yPosition);
        yPosition += 7;
      });

      // Add disclaimer if requested
      if (options.includeDisclaimer && index === entries.length - 1) {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          currentPage++;
          yPosition = 20;
        }
        this.addDisclaimer(doc, pageHeight - 20);
      }
    });

    // Generate filename
    const date = new Date().toISOString().split('T')[0];
    const fileName = `journal-export-${date}-${entries.length}-entries.pdf`;

    // Add to export history
    if (!isPreview) {
      this.addToExportHistory('multiple', entries.length, fileName, options);
    }

    return { blob: doc.output('blob'), fileName };
  }

  async exportDateRange(
    entries: any[],
    startDate: string,
    endDate: string,
    options: ExportOptions = {},
    isPreview: boolean = false,
    aiInsights?: any
  ): Promise<{ blob: Blob; fileName: string }> {
    const doc = new jsPDF();
    let currentPage = 1;
    let yPosition = 20;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 15;

    // Title page
    if (options.includeWatermark) {
      this.addWatermark(doc);
    }
    
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(33, 37, 41);
    doc.text('Journal Entries - Date Range Export', margin, yPosition);
    yPosition += 20;

    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(108, 117, 125);
    doc.text(`Date Range: ${this.formatDate(startDate)} - ${this.formatDate(endDate)}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Total Entries: ${entries.length}`, margin, yPosition);
    yPosition += 10;
    doc.text(`Export Date: ${this.formatDate(new Date().toISOString())}`, margin, yPosition);
    yPosition += 20;

    // Add AI Insights section if available and requested
    if (options.includeAIInsights && aiInsights) {
      console.log('PDF Export Debug - Adding AI Insights:', aiInsights);
      
      doc.addPage();
      currentPage++;
      yPosition = 20;
      
      if (options.includeWatermark) {
        this.addWatermark(doc);
      }

      // AI Insights Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(33, 37, 41);
      doc.text('AI Weekly Insights', margin, yPosition);
      yPosition += 20;

      // Emotional State
      if (aiInsights.emotionalState) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Emotional State', margin, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(108, 117, 125);
        const emotionalLines = doc.splitTextToSize(aiInsights.emotionalState, 180);
        emotionalLines.forEach((line: string) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            currentPage++;
            yPosition = 20;
            if (options.includeWatermark) {
              this.addWatermark(doc);
            }
          }
          doc.text(line, margin, yPosition);
          yPosition += 7;
        });
        yPosition += 10;
      }

      // Patterns
      if (aiInsights.patterns && aiInsights.patterns.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(33, 37, 41);
        doc.text('Patterns Identified', margin, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(108, 117, 125);
        aiInsights.patterns.forEach((pattern: string) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            currentPage++;
            yPosition = 20;
            if (options.includeWatermark) {
              this.addWatermark(doc);
            }
          }
          const patternLines = doc.splitTextToSize(`• ${pattern}`, 180);
          patternLines.forEach((line: string) => {
            doc.text(line, margin, yPosition);
            yPosition += 7;
          });
        });
        yPosition += 10;
      }

      // Recommendations
      if (aiInsights.recommendations && aiInsights.recommendations.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(33, 37, 41);
        doc.text('Recommendations', margin, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(108, 117, 125);
        aiInsights.recommendations.forEach((recommendation: string) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            currentPage++;
            yPosition = 20;
            if (options.includeWatermark) {
              this.addWatermark(doc);
            }
          }
          const recLines = doc.splitTextToSize(`• ${recommendation}`, 180);
          recLines.forEach((line: string) => {
            doc.text(line, margin, yPosition);
            yPosition += 7;
          });
        });
        yPosition += 10;
      }

      // Top Themes
      if (aiInsights.topThemes && aiInsights.topThemes.length > 0) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(33, 37, 41);
        doc.text('Top Themes', margin, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(108, 117, 125);
        aiInsights.topThemes.forEach((theme: string) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            currentPage++;
            yPosition = 20;
            if (options.includeWatermark) {
              this.addWatermark(doc);
            }
          }
          doc.text(`• ${theme}`, margin, yPosition);
          yPosition += 7;
        });
        yPosition += 10;
      }

      // Summary
      if (aiInsights.summary) {
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(33, 37, 41);
        doc.text('Summary', margin, yPosition);
        yPosition += 10;
        
        doc.setFontSize(12);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(108, 117, 125);
        const summaryLines = doc.splitTextToSize(aiInsights.summary, 180);
        summaryLines.forEach((line: string) => {
          if (yPosition > pageHeight - 30) {
            doc.addPage();
            currentPage++;
            yPosition = 20;
            if (options.includeWatermark) {
              this.addWatermark(doc);
            }
          }
          doc.text(line, margin, yPosition);
          yPosition += 7;
        });
      }
    }

    // Add entries (similar to multiple entries)
    entries.forEach((entry, index) => {
      doc.addPage();
      currentPage++;
      yPosition = 20;
      
      if (options.includeWatermark) {
        this.addWatermark(doc);
      }

      // Entry header
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(33, 37, 41);
      const title = entry.title || `Entry ${index + 1}`;
      doc.text(`${index + 1}. ${title}`, margin, yPosition);
      yPosition += 15;

      // Entry metadata
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(108, 117, 125);
      
      if (options.includeDate !== false) {
        doc.text(`Date: ${this.formatDate(entry.created_at)}`, margin, yPosition);
        yPosition += 8;
      }
      
      if (options.includeMood !== false && entry.mood) {
        doc.text(`Mood: ${entry.mood}`, margin, yPosition);
        yPosition += 8;
      }
      
      if (options.includeTags !== false && entry.tags && entry.tags.length > 0) {
        doc.text(`Tags: ${entry.tags.join(', ')}`, margin, yPosition);
        yPosition += 8;
      }

      yPosition += 10;

      // Entry content
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(33, 37, 41);
      
      let content = entry.content;
      if (options.removeSensitiveData) {
        content = this.removeSensitiveData(content);
      }

      const lines = doc.splitTextToSize(content, 180);
      lines.forEach((line: string) => {
        if (yPosition > pageHeight - 40) {
          doc.addPage();
          currentPage++;
          yPosition = 20;
          if (options.includeWatermark) {
            this.addWatermark(doc);
          }
        }
        doc.text(line, margin, yPosition);
        yPosition += 7;
      });

      // Add disclaimer if requested
      if (options.includeDisclaimer && index === entries.length - 1) {
        if (yPosition > pageHeight - 30) {
          doc.addPage();
          currentPage++;
          yPosition = 20;
        }
        this.addDisclaimer(doc, pageHeight - 20);
      }
    });

    // Generate filename
    const date = new Date().toISOString().split('T')[0];
    const fileName = `journal-range-${startDate}-${endDate}.pdf`;

    // Add to export history
    if (!isPreview) {
      this.addToExportHistory('date_range', entries.length, fileName, options);
    }

    return { blob: doc.output('blob'), fileName };
  }

  private addToExportHistory(type: 'single' | 'multiple' | 'date_range', entryCount: number, fileName: string, options: ExportOptions): void {
    const historyItem: ExportHistory = {
      id: Date.now().toString(),
      type,
      entryCount,
      exportedAt: new Date().toISOString(),
      fileName,
      options
    };

    this.exportHistory.unshift(historyItem);
    
    // Keep only last 50 exports
    if (this.exportHistory.length > 50) {
      this.exportHistory = this.exportHistory.slice(0, 50);
    }

    // Save to localStorage
    try {
      localStorage.setItem('journal_export_history', JSON.stringify(this.exportHistory));
    } catch (error) {
      console.warn('Failed to save export history to localStorage:', error);
    }
  }

  getExportHistory(): ExportHistory[] {
    // Load from localStorage if not already loaded
    if (this.exportHistory.length === 0) {
      try {
        const saved = localStorage.getItem('journal_export_history');
        if (saved) {
          this.exportHistory = JSON.parse(saved);
        }
      } catch (error) {
        console.warn('Failed to load export history from localStorage:', error);
      }
    }
    return this.exportHistory;
  }

  clearExportHistory(): void {
    this.exportHistory = [];
    try {
      localStorage.removeItem('journal_export_history');
    } catch (error) {
      console.warn('Failed to clear export history from localStorage:', error);
    }
  }

  async downloadPDF(blob: Blob, fileName: string): Promise<void> {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async previewPDF(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

export const pdfExporter = PDFExporter.getInstance();
