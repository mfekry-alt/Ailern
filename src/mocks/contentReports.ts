/**
 * Mock data for Content Reports feature
 * Contains realistic dummy data for the reporting system
 */

export type ReportStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected';

export type ReportReason =
    | 'Pornographic / Sexual Content'
    | 'Hate Speech'
    | 'Religious Insult'
    | 'Harassment or Bullying'
    | 'Violence or Graphic Content'
    | 'Misinformation'
    | 'Copyright Violation'
    | 'Spam or Scam'
    | 'Dangerous or Illegal Activities'
    | 'Terrorism or Extremism'
    | 'Child Safety Concerns'
    | 'Other';

export const REPORT_REASONS: ReportReason[] = [
    'Pornographic / Sexual Content',
    'Hate Speech',
    'Religious Insult',
    'Harassment or Bullying',
    'Violence or Graphic Content',
    'Misinformation',
    'Copyright Violation',
    'Spam or Scam',
    'Dangerous or Illegal Activities',
    'Terrorism or Extremism',
    'Child Safety Concerns',
    'Other',
];

export type MaterialType = 'Video' | 'PDF' | 'Document' | 'Image';

export interface ContentReport {
    id: string;
    materialName: string;
    materialType: MaterialType;
    courseName: string;
    courseId: number;
    instructorName: string;
    reason: ReportReason;
    additionalComment: string;
    reporterName: string;
    reporterEmail: string;
    reporterId: string;
    submittedDate: string;
    status: ReportStatus;
    materialPreviewUrl?: string;
}

export const mockContentReports: ContentReport[] = [
    {
        id: 'RPT-001',
        materialName: 'Introduction to Neural Networks.mp4',
        materialType: 'Video',
        courseName: 'Deep Learning Fundamentals',
        courseId: 1,
        instructorName: 'Dr. Ahmed Hassan',
        reason: 'Misinformation',
        additionalComment: 'The video contains outdated information about activation functions that contradicts current research. This could mislead students who are studying for certifications.',
        reporterName: 'Sara Mohamed',
        reporterEmail: 'sara.m@student.ailern.com',
        reporterId: 'STU-042',
        submittedDate: '2026-06-08T10:30:00Z',
        status: 'Pending',
    },
    {
        id: 'RPT-002',
        materialName: 'Advanced Data Structures - Lecture 5.pdf',
        materialType: 'PDF',
        courseName: 'Computer Science 301',
        courseId: 2,
        instructorName: 'Prof. Laila Abdel-Rahman',
        reason: 'Copyright Violation',
        additionalComment: 'This PDF appears to be a direct copy from a copyrighted textbook "Introduction to Algorithms" without proper attribution.',
        reporterName: 'Omar Khaled',
        reporterEmail: 'omar.k@student.ailern.com',
        reporterId: 'STU-089',
        submittedDate: '2026-06-07T15:20:00Z',
        status: 'Under Review',
    },
    {
        id: 'RPT-003',
        materialName: 'Group Project Discussion.mp4',
        materialType: 'Video',
        courseName: 'Business Management 101',
        courseId: 3,
        instructorName: 'Dr. Nour El-Din',
        reason: 'Harassment or Bullying',
        additionalComment: 'The recorded discussion video contains a section where one student is being verbally attacked by others. This should be removed or edited.',
        reporterName: 'Fatima Ali',
        reporterEmail: 'fatima.a@student.ailern.com',
        reporterId: 'STU-156',
        submittedDate: '2026-06-07T09:15:00Z',
        status: 'Approved',
    },
    {
        id: 'RPT-004',
        materialName: 'Chemistry Lab Safety.pdf',
        materialType: 'PDF',
        courseName: 'General Chemistry',
        courseId: 4,
        instructorName: 'Dr. Youssef Ibrahim',
        reason: 'Dangerous or Illegal Activities',
        additionalComment: 'The safety manual contains incorrect chemical mixing instructions that could be dangerous if followed in a real lab setting.',
        reporterName: 'Ahmed Sami',
        reporterEmail: 'ahmed.s@student.ailern.com',
        reporterId: 'STU-201',
        submittedDate: '2026-06-06T14:45:00Z',
        status: 'Pending',
    },
    {
        id: 'RPT-005',
        materialName: 'Historical Analysis Essay.docx',
        materialType: 'Document',
        courseName: 'World History',
        courseId: 5,
        instructorName: 'Prof. Maha Ezzat',
        reason: 'Hate Speech',
        additionalComment: 'The document contains biased language and stereotyping of certain ethnic groups in the historical analysis section.',
        reporterName: 'Karim Hassan',
        reporterEmail: 'karim.h@student.ailern.com',
        reporterId: 'STU-078',
        submittedDate: '2026-06-05T11:30:00Z',
        status: 'Rejected',
    },
    {
        id: 'RPT-006',
        materialName: 'Marketing Strategies Presentation.pdf',
        materialType: 'PDF',
        courseName: 'Digital Marketing',
        courseId: 6,
        instructorName: 'Dr. Hana Mostafa',
        reason: 'Spam or Scam',
        additionalComment: 'The presentation includes links to suspicious external websites that appear to be affiliate marketing scams disguised as educational resources.',
        reporterName: 'Yasmin Adel',
        reporterEmail: 'yasmin.a@student.ailern.com',
        reporterId: 'STU-312',
        submittedDate: '2026-06-04T16:00:00Z',
        status: 'Under Review',
    },
    {
        id: 'RPT-007',
        materialName: 'Anatomy Lecture Recording.mp4',
        materialType: 'Video',
        courseName: 'Human Anatomy',
        courseId: 7,
        instructorName: 'Dr. Amira Fawzy',
        reason: 'Violence or Graphic Content',
        additionalComment: 'The lecture video shows graphic surgical footage without any prior warning or content disclaimer, which was disturbing for some students.',
        reporterName: 'Mohamed Taha',
        reporterEmail: 'mohamed.t@student.ailern.com',
        reporterId: 'STU-445',
        submittedDate: '2026-06-03T08:20:00Z',
        status: 'Rejected',
    },
    {
        id: 'RPT-008',
        materialName: 'Ethics in AI Research.pdf',
        materialType: 'PDF',
        courseName: 'AI Ethics & Society',
        courseId: 8,
        instructorName: 'Prof. Dina Saeed',
        reason: 'Religious Insult',
        additionalComment: 'One section of the document makes dismissive and offensive remarks about religious perspectives on AI ethics.',
        reporterName: 'Aya Mahmoud',
        reporterEmail: 'aya.m@student.ailern.com',
        reporterId: 'STU-567',
        submittedDate: '2026-06-02T13:10:00Z',
        status: 'Pending',
    },
    {
        id: 'RPT-009',
        materialName: 'Psychology Case Studies.mp4',
        materialType: 'Video',
        courseName: 'Abnormal Psychology',
        courseId: 9,
        instructorName: 'Dr. Tarek Nabil',
        reason: 'Child Safety Concerns',
        additionalComment: 'The case study video discusses sensitive topics involving minors without proper content warnings or ethical review disclosure.',
        reporterName: 'Rania Samir',
        reporterEmail: 'rania.s@student.ailern.com',
        reporterId: 'STU-234',
        submittedDate: '2026-06-01T10:00:00Z',
        status: 'Under Review',
    },
    {
        id: 'RPT-010',
        materialName: 'Political Science Notes.docx',
        materialType: 'Document',
        courseName: 'Comparative Politics',
        courseId: 10,
        instructorName: 'Prof. Sherif Gamal',
        reason: 'Terrorism or Extremism',
        additionalComment: 'The lecture notes appear to contain content that glorifies certain extremist ideologies under the guise of academic analysis.',
        reporterName: 'Lina Khaled',
        reporterEmail: 'lina.k@student.ailern.com',
        reporterId: 'STU-890',
        submittedDate: '2026-05-30T17:45:00Z',
        status: 'Pending',
    },
    {
        id: 'RPT-011',
        materialName: 'Art History Slides.pdf',
        materialType: 'PDF',
        courseName: 'Renaissance Art',
        courseId: 11,
        instructorName: 'Dr. Salma Adel',
        reason: 'Pornographic / Sexual Content',
        additionalComment: 'Some images in the art history slides are explicit in nature without any academic justification or content warning.',
        reporterName: 'Nada Fouad',
        reporterEmail: 'nada.f@student.ailern.com',
        reporterId: 'STU-123',
        submittedDate: '2026-05-29T12:30:00Z',
        status: 'Approved',
    },
    {
        id: 'RPT-012',
        materialName: 'Climate Change Data Analysis.pdf',
        materialType: 'PDF',
        courseName: 'Environmental Science',
        courseId: 12,
        instructorName: 'Dr. Waleed Fahmy',
        reason: 'Misinformation',
        additionalComment: 'The document presents climate change denial arguments as equally valid scientific perspectives without proper context.',
        reporterName: 'Hisham Barakat',
        reporterEmail: 'hisham.b@student.ailern.com',
        reporterId: 'STU-678',
        submittedDate: '2026-05-28T09:00:00Z',
        status: 'Pending',
    },
];

/**
 * Get dashboard stats for content reports
 */
export const getReportStats = (reports: ContentReport[]) => ({
    total: reports.length,
    pending: reports.filter(r => r.status === 'Pending').length,
    underReview: reports.filter(r => r.status === 'Under Review').length,
    approved: reports.filter(r => r.status === 'Approved').length,
    rejected: reports.filter(r => r.status === 'Rejected').length,
});

/**
 * Unique course names from reports
 */
export const getUniqueCourses = (reports: ContentReport[]) =>
    [...new Set(reports.map(r => r.courseName))].sort();
