import { useState, useEffect } from 'react';

interface TypewriterTextProps {
    lines: string[];
    className?: string;
    typingSpeed?: number;
    deletingSpeed?: number;
    pauseDuration?: number;
}

export function TypewriterText({
    lines,
    className,
    typingSpeed = 100,
    deletingSpeed = 50,
    pauseDuration = 2000
}: TypewriterTextProps) {
    const [displayedText, setDisplayedText] = useState('');
    const [currentLineIdx, setCurrentLineIdx] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const targetLine = lines[currentLineIdx];

        const timeout = setTimeout(() => {
            if (!isDeleting) {
                // TYPING PHASE
                if (displayedText.length < targetLine.length) {
                    // Type next character
                    setDisplayedText(targetLine.substring(0, displayedText.length + 1));
                } else {
                    // Line complete, wait before deleting
                    setTimeout(() => setIsDeleting(true), pauseDuration);
                }
            } else {
                // DELETING PHASE
                if (displayedText.length > 0) {
                    // Delete character
                    setDisplayedText(targetLine.substring(0, displayedText.length - 1));
                } else {
                    // Deletion complete, move to next line
                    setIsDeleting(false);
                    setCurrentLineIdx((prev) => (prev + 1) % lines.length);
                }
            }
        }, isDeleting ? deletingSpeed : typingSpeed);

        return () => clearTimeout(timeout);
    }, [displayedText, currentLineIdx, isDeleting, lines, typingSpeed, deletingSpeed, pauseDuration]);

    return (
        <span className="inline-flex items-center">
            <span className={className}>
                {displayedText}
            </span>
            <span className="ml-1 lg:ml-2 text-primary animate-pulse">
                |
            </span>
        </span>
    );
}
