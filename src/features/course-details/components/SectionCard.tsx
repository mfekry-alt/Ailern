import { memo, useState } from 'react';

import { ChevronDown, ChevronUp, Layers } from 'lucide-react';

import { FileItem } from './FileItem';

import type { SectionDto } from '../types';



interface SectionCardProps {

    section: SectionDto;

    courseId: string;

}



export const SectionCard = memo(({ section, courseId }: SectionCardProps) => {

    const [isExpanded, setIsExpanded] = useState(false);

    const files = section.sectionFiles ?? [];



    return (

        <div

            className={`border rounded-2xl overflow-hidden transition-colors ${

                isExpanded

                    ? 'border-blue-200 dark:border-blue-500/30 bg-blue-50/30 dark:bg-blue-500/5'

                    : 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 hover:border-blue-300 dark:hover:border-slate-600'

            }`}

        >

            <button

                onClick={() => setIsExpanded(!isExpanded)}

                className="w-full flex items-center justify-between p-4 sm:p-5 transition-colors"

            >

                <div className="flex items-center gap-4">

                    <div

                        className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-colors ${

                            isExpanded

                                ? 'bg-blue-600 text-white'

                                : 'bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-slate-300'

                        }`}

                    >

                        {section.sectionNumber}

                    </div>

                    <div className="text-left">

                        <h3

                            className={`font-semibold ${

                                isExpanded

                                    ? 'text-blue-700 dark:text-blue-400'

                                    : 'text-gray-900 dark:text-white'

                            }`}

                        >

                            {section.title}

                        </h3>

                        <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">

                            {files.length} {files.length === 1 ? 'file' : 'files'}

                        </p>

                    </div>

                </div>

                <div

                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${

                        isExpanded

                            ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'

                            : 'text-gray-400 dark:text-slate-500'

                    }`}

                >

                    {isExpanded ? (

                        <ChevronUp className="w-5 h-5" />

                    ) : (

                        <ChevronDown className="w-5 h-5" />

                    )}

                </div>

            </button>



            {isExpanded && (

                <div className="px-5 py-5 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900/50 space-y-2.5">

                    {files.length === 0 ? (

                        <div className="text-center py-6 text-gray-500 dark:text-slate-400 text-sm flex items-center justify-center gap-2">

                            <Layers className="w-4 h-4" />

                            No files in this section

                        </div>

                    ) : (

                        files.map((file) => (

                            <FileItem key={file.id} file={file} courseId={courseId} />

                        ))

                    )}

                </div>

            )}

        </div>

    );

});



SectionCard.displayName = 'SectionCard';

