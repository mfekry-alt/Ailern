/**
 * Assignment Upload Integration Example
 * 
 * This example demonstrates how to use the assignment service
 * to submit assignments with multiple files.
 */

import { assignmentService } from '@/api/services';
import type { SubmitAssignmentDto } from '@/api/services/assignment.service';

/**
 * Example 1: Student submits assignment with multiple files
 */
export const exampleStudentSubmission = async () => {
    // Simulate selecting multiple files
    const files: File[] = [
        // In real usage, these would come from input[type="file"]
        new File(['content1'], 'solution.py', { type: 'text/x-python' }),
        new File(['content2'], 'analysis.pdf', { type: 'application/pdf' }),
        new File(['content3'], 'readme.txt', { type: 'text/plain' }),
    ];

    const submissionData: SubmitAssignmentDto = {
        assignmentId: 'assignment-123',
        files: files,
        notes: 'Here is my submission with all required files.',
    };

    try {
        const submission = await assignmentService.submitAssignment(submissionData);
        console.log('✅ Submission successful:', submission);
        return submission;
    } catch (error) {
        console.error('❌ Submission failed:', error);
        throw error;
    }
};

/**
 * Example 2: Instructor creates assignment with attachments
 */
export const exampleInstructorCreateAssignment = async () => {
    const attachments: File[] = [
        new File(['rubric content'], 'rubric.pdf', { type: 'application/pdf' }),
        new File(['template content'], 'template.docx', { 
            type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
        }),
    ];

    try {
        const assignment = await assignmentService.createAssignment({
            title: 'Programming Assignment 1: Data Structures',
            description: 'Implement linked list, stack, and queue data structures',
            courseId: 'CS202',
            dueDate: '2024-02-15T23:59:59',
            totalPoints: 100,
            status: 'published',
            allowedFileTypes: ['PDF', 'ZIP', 'PY', 'JAVA'],
            maxFileSize: '10 MB',
            attachments: attachments,
        });
        
        console.log('✅ Assignment created:', assignment);
        return assignment;
    } catch (error) {
        console.error('❌ Assignment creation failed:', error);
        throw error;
    }
};

/**
 * Example 3: Handle file validation before submission
 */
export const validateFiles = (
    files: File[],
    allowedTypes: string[],
    maxSizeBytes: number
): { valid: File[]; errors: string[] } => {
    const valid: File[] = [];
    const errors: string[] = [];

    const allowedExtensions = allowedTypes.map(t => t.toLowerCase());

    for (const file of files) {
        const ext = file.name.split('.').pop()?.toLowerCase();
        
        // Check file type
        if (!ext || !allowedExtensions.includes(ext)) {
            errors.push(`${file.name}: Invalid file type. Allowed: ${allowedTypes.join(', ')}`);
            continue;
        }
        
        // Check file size
        if (file.size > maxSizeBytes) {
            const maxMB = (maxSizeBytes / (1024 * 1024)).toFixed(1);
            const fileMB = (file.size / (1024 * 1024)).toFixed(1);
            errors.push(`${file.name}: File too large (${fileMB} MB). Max: ${maxMB} MB`);
            continue;
        }
        
        valid.push(file);
    }

    return { valid, errors };
};

/**
 * Example 4: Submit with progress tracking
 */
export const submitWithProgress = async (
    assignmentId: string,
    files: File[],
    onProgress?: (percent: number) => void
) => {
    try {
        // Create submission data
        const submissionData: SubmitAssignmentDto = {
            assignmentId,
            files,
            notes: 'Submitted with progress tracking',
        };

        // Simulate progress (in real implementation, axios provides this)
        if (onProgress) {
            const progressInterval = setInterval(() => {
                const randomProgress = Math.floor(Math.random() * 30);
                onProgress(Math.min(100, randomProgress));
            }, 500);

            setTimeout(() => clearInterval(progressInterval), 3000);
        }

        const submission = await assignmentService.submitAssignment(submissionData);
        
        if (onProgress) onProgress(100);
        
        return submission;
    } catch (error) {
        console.error('Submission error:', error);
        throw error;
    }
};

/**
 * Example 5: Get and display student assignments
 */
export const displayStudentAssignments = async () => {
    try {
        const assignments = await assignmentService.getStudentAssignments();
        
        console.log(`📚 Found ${assignments.length} assignments:`);
        
        assignments.forEach(assignment => {
            console.log(`
                ID: ${assignment.id}
                Title: ${assignment.title}
                Status: ${assignment.status}
                Due: ${assignment.dueDate}
                Points: ${assignment.points}
                Attachments: ${assignment.attachments.length} files
            `);
        });
        
        return assignments;
    } catch (error) {
        console.error('Failed to fetch assignments:', error);
        throw error;
    }
};

/**
 * Example 6: Instructor views submissions
 */
export const viewAssignmentSubmissions = async (assignmentId: string) => {
    try {
        const submissions = await assignmentService.getAssignmentSubmissions(assignmentId);
        
        console.log(`📥 Found ${submissions.length} submissions:`);
        
        submissions.forEach(submission => {
            console.log(`
                Student: ${submission.studentName}
                Submitted: ${submission.submittedAt}
                Status: ${submission.status}
                Grade: ${submission.grade || 'Not graded'}
                Files: ${submission.files?.length || 0}
            `);
        });
        
        return submissions;
    } catch (error) {
        console.error('Failed to fetch submissions:', error);
        throw error;
    }
};

/**
 * Example 7: Complete submission workflow with UI integration
 */
export const completeSubmissionWorkflow = async (
    assignmentId: string,
    fileInput: HTMLInputElement,
    onProgress: (percent: number) => void,
    onError: (message: string) => void,
    onSuccess: () => void
) => {
    try {
        // Get files from input
        const files = Array.from(fileInput.files || []);
        
        if (files.length === 0) {
            onError('Please select at least one file');
            return;
        }
        
        // Validate files (example limits)
        const allowedTypes = ['pdf', 'doc', 'docx', 'zip', 'py'];
        const maxSizeBytes = 10 * 1024 * 1024; // 10 MB
        
        const { valid, errors } = validateFiles(files, allowedTypes, maxSizeBytes);
        
        if (errors.length > 0) {
            onError(errors.join('\n'));
            return;
        }
        
        if (valid.length === 0) {
            onError('No valid files to submit');
            return;
        }
        
        // Submit with progress
        await submitWithProgress(assignmentId, valid, onProgress);
        
        // Success!
        onSuccess();
        
    } catch (error) {
        onError(error instanceof Error ? error.message : 'Submission failed');
    }
};

// Export examples
export const assignmentExamples = {
    studentSubmission: exampleStudentSubmission,
    instructorCreate: exampleInstructorCreateAssignment,
    validateFiles,
    submitWithProgress,
    displayStudentAssignments,
    viewSubmissions: viewAssignmentSubmissions,
    completeWorkflow: completeSubmissionWorkflow,
};
