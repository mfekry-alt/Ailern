import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ROUTES } from '@/lib/constants';

export const InstructorCourseEditPage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isNew = !id;

    const [formData, setFormData] = useState({
        title: '',
        courseId: '',
        description: '',
        department: '',
        academicYear: '',
        readyToSubmit: false,
    });

    const handleSubmit = (isDraft: boolean) => {
        if (!isDraft && !formData.title.trim()) {
            alert('Course title is required for submission');
            return;
        }

        console.log('Submitting course:', { ...formData, isDraft });

        if (isDraft) {
            alert('Course saved as draft successfully!');
        } else {
            alert('Course submitted for approval successfully!');
        }

        // API call will go here
        navigate(ROUTES.INSTRUCTOR_COURSES);
    };

    return (
        <div className="px-32 py-8 max-w-[1920px] mx-auto" style={{ background: 'linear-gradient(90deg, #f8fafc 0%, #f8fafc 100%)' }}>
            <div className="max-w-4xl mx-auto">
                {/* Background Border Container */}
                <div className="flex flex-col items-start pt-px pb-[17px] px-px relative bg-white rounded-md border border-solid border-green-100">
                    {/* Header */}
                    <div className="flex flex-col items-start pt-4 pb-[17px] px-6 relative self-stretch w-full flex-[0_0_auto] border-b [border-bottom-style:solid] border-green-100">
                        <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                            <div className="relative flex items-center justify-center self-stretch mt-[-1.00px] font-semibold text-[#212529] text-[24px] leading-[32px]">
                                {isNew ? 'Create New Course' : 'Edit Course'}
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="flex flex-col items-start gap-8 p-6 relative self-stretch w-full flex-[0_0_auto]">
                        <div className="flex flex-col items-start gap-6 relative self-stretch w-full flex-[0_0_auto]">
                            {/* Course Title */}
                            <div className="flex flex-col items-start gap-1 relative self-stretch w-full flex-[0_0_auto]">
                                <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                                    <p className="relative flex items-start justify-start self-stretch mt-[-1.00px] font-medium text-[14px] leading-[20px]">
                                        <span className="text-[#495057] font-medium text-[14px] leading-[20px]">
                                            Course Title{" "}
                                        </span>
                                        <span className="text-red-500 font-medium text-[14px] leading-[20px]">
                                            *
                                        </span>
                                    </p>
                                </div>

                                <div className="flex flex-col items-start px-[13px] py-[11px] self-stretch w-full flex-[0_0_auto] bg-white rounded-md overflow-hidden shadow-[0px_1px_2px_#0000000d] relative border border-solid border-[#dee2e6]">
                                    <input
                                        type="text"
                                        placeholder="e.g., Introduction to Computer Science"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto] font-normal text-gray-500 text-[14px] leading-[20px] bg-transparent border-none outline-none"
                                    />
                                </div>
                            </div>

                            {/* Course ID and Creation Date */}
                            <div className="flex items-start justify-center gap-6 relative self-stretch w-full flex-[0_0_auto]">
                                <div className="flex flex-col items-start gap-1 relative flex-1 self-stretch grow">
                                    <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                                        <div className="text-[#495057] relative flex items-start justify-start self-stretch mt-[-1.00px] font-medium text-[14px] leading-[20px]">
                                            Course ID
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-start px-[13px] py-[11px] self-stretch w-full flex-[0_0_auto] bg-white rounded-md overflow-hidden shadow-[0px_1px_2px_#0000000d] relative border border-solid border-[#dee2e6]">
                                        <input
                                            type="text"
                                            placeholder="e.g., CS101 (auto-generated if blank)"
                                            value={formData.courseId}
                                            onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                                            className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto] font-normal text-gray-500 text-[14px] leading-[20px] bg-transparent border-none outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex flex-col items-start gap-1 relative flex-1 self-stretch grow">
                                    <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                                        <div className="relative flex items-start justify-start self-stretch mt-[-1.00px] font-medium text-[#495057] text-[14px] leading-[20px]">
                                            Creation Date
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-start px-[13px] py-[9px] self-stretch w-full flex-[0_0_auto] bg-[#f0f1f4] rounded-md overflow-hidden shadow-[0px_1px_2px_#0000000d] relative border border-solid border-[#dee2e6]">
                                        <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto] overflow-scroll">
                                            <div className="relative flex items-start justify-start self-stretch font-normal text-black text-[14px] leading-[20px]">
                                                {new Date().toLocaleDateString('en-CA')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <div className="flex flex-col items-start gap-1 relative self-stretch w-full flex-[0_0_auto]">
                                <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                                    <div className="relative flex items-start justify-start self-stretch mt-[-1.00px] font-medium text-[#495057] text-[14px] leading-[20px]">
                                        Description
                                    </div>
                                </div>

                                <div className="flex flex-col items-start pt-[9px] pb-[69px] px-[13px] relative self-stretch w-full flex-[0_0_auto] bg-white rounded-md overflow-scroll border border-solid border-[#dee2e6] shadow-[0px_1px_2px_#0000000d]">
                                    <textarea
                                        rows={4}
                                        placeholder="Provide a detailed description of the course."
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto] font-normal text-gray-500 text-[14px] leading-[20px] bg-transparent border-none outline-none resize-none"
                                    />
                                </div>
                            </div>

                            {/* Department and Academic Year */}
                            <div className="flex items-start justify-center gap-6 relative self-stretch w-full flex-[0_0_auto]">
                                <div className="flex flex-col items-start gap-1 relative flex-1 self-stretch grow">
                                    <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                                        <div className="relative flex items-start justify-start self-stretch mt-[-1.00px] font-medium text-[#495057] text-[14px] leading-[20px]">
                                            Department
                                        </div>
                                    </div>

                                    <div className="relative self-stretch w-full h-[38px] bg-white rounded-md border border-solid border-[#dee2e6] shadow-[0px_1px_2px_#0000000d]">
                                        <select
                                            value={formData.department}
                                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                            className="w-full h-full px-[13px] py-[9px] bg-transparent border-none outline-none font-normal text-black text-[14px] leading-[20px]"
                                        >
                                            <option value="">Select a department</option>
                                            <option value="cs">Computer Science</option>
                                            <option value="math">Mathematics</option>
                                            <option value="physics">Physics</option>
                                            <option value="engineering">Engineering</option>
                                        </select>
                                        <div className="flex flex-col w-[379px] h-[38px] items-end justify-center pl-[349px] pr-[9px] py-[8.5px] absolute top-0 left-0 pointer-events-none">
                                            <div className="relative w-[21px] h-[21px]">
                                                <svg className="absolute w-[40.00%] h-[20.00%] top-[40.00%] left-[30.00%]" viewBox="0 0 24 24" fill="none">
                                                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col items-start gap-1 relative flex-1 self-stretch grow">
                                    <div className="flex flex-col items-start relative self-stretch w-full flex-[0_0_auto]">
                                        <div className="relative flex items-start justify-start self-stretch mt-[-1.00px] font-medium text-[#495057] text-[14px] leading-[20px]">
                                            Academic Year
                                        </div>
                                    </div>

                                    <div className="relative self-stretch w-full h-[38px] bg-white rounded-md border border-solid border-[#dee2e6] shadow-[0px_1px_2px_#0000000d]">
                                        <select
                                            value={formData.academicYear}
                                            onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                                            className="w-full h-full px-[13px] py-[9px] bg-transparent border-none outline-none font-normal text-black text-[14px] leading-[20px]"
                                        >
                                            <option value="">Select an academic year</option>
                                            <option value="2024-2025">2024-2025</option>
                                            <option value="2025-2026">2025-2026</option>
                                            <option value="2026-2027">2026-2027</option>
                                        </select>
                                        <div className="flex flex-col w-[379px] h-[38px] items-end justify-center pl-[349px] pr-[9px] py-[8.5px] absolute top-0 left-0 pointer-events-none">
                                            <div className="relative w-[21px] h-[21px]">
                                                <svg className="absolute w-[40.00%] h-[20.00%] top-[40.00%] left-[30.00%]" viewBox="0 0 24 24" fill="none">
                                                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Ready to Submit Checkbox */}
                            <div className="flex items-center relative self-stretch w-full flex-[0_0_auto]">
                                <input
                                    type="checkbox"
                                    id="readyToSubmit"
                                    checked={formData.readyToSubmit}
                                    onChange={(e) => setFormData({ ...formData, readyToSubmit: e.target.checked })}
                                    className="w-4 h-4 bg-white rounded relative border border-solid border-[#dee2e6]"
                                />
                                <div className="inline-flex flex-col items-start pl-2 pr-0 py-0 relative flex-[0_0_auto]">
                                    <label htmlFor="readyToSubmit" className="relative flex items-center justify-center w-fit mt-[-1.00px] font-normal text-[#212529] text-[14px] leading-[20px] whitespace-nowrap cursor-pointer">
                                        Ready to Submit for Approval
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-start justify-end gap-3 pt-[25px] pb-0 px-0 relative self-stretch w-full flex-[0_0_auto] border-t [border-top-style:solid] border-green-100">
                            <button
                                onClick={() => handleSubmit(true)}
                                className="all-[unset] box-border flex-col items-center bg-white border border-solid border-[#dee2e6] inline-flex justify-center px-[17px] py-[9px] relative flex-[0_0_auto] rounded-md shadow-[0px_1px_2px_#0000000d] hover:bg-gray-50 transition-colors"
                            >
                                <div className="relative flex items-center justify-center w-fit mt-[-1.00px] font-medium text-[#495057] text-[14px] text-center leading-[20px] whitespace-nowrap">
                                    Save Draft
                                </div>
                            </button>

                            <button
                                onClick={() => handleSubmit(false)}
                                className="all-[unset] box-border items-start bg-[#0d7ff2] inline-flex justify-center px-[17px] py-[9px] relative flex-[0_0_auto] rounded-md shadow-[0px_1px_2px_#0000000d] hover:bg-[#0b6dd4] transition-colors"
                            >
                                <div className="relative flex items-center justify-center w-fit mt-[-1.00px] font-medium text-white text-[14px] text-center leading-[20px] whitespace-nowrap">
                                    Submit for Approval
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

