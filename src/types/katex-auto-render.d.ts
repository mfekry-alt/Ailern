declare module 'katex/dist/contrib/auto-render' {
    export interface RenderMathInElementOptions {
        delimiters?: {
            left: string;
            right: string;
            display: boolean;
        }[];
        ignoredTags?: string[];
        ignoredClasses?: string[];
        errorCallback?: (msg: string, err: Error) => void;
        preProcess?: (math: string) => string;
        throwOnError?: boolean;
    }

    function renderMathInElement(
        element: HTMLElement,
        options?: RenderMathInElementOptions
    ): void;

    export default renderMathInElement;
}
