import React from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface MessageContentProps {
  content: string;
  className?: string;
}

export function MessageContent({ content, className = '' }: MessageContentProps) {
  const formatContent = (text: string) => {
    // Split text by LaTeX patterns first
    const parts = [];
    let lastIndex = 0;
    
    // Pattern for block math ($$...$$)
    const blockMathRegex = /\$\$([^$]+)\$\$/g;
    // Pattern for inline math ($...$)
    const inlineMathRegex = /\$([^$\n]+)\$/g;
    
    // First, handle block math
    let blockMatch;
    const blockMatches = [];
    while ((blockMatch = blockMathRegex.exec(text)) !== null) {
      blockMatches.push({
        type: 'block',
        start: blockMatch.index,
        end: blockMatch.index + blockMatch[0].length,
        content: blockMatch[1].trim()
      });
    }
    
    // Then handle inline math (avoiding conflicts with block math)
    let inlineMatch;
    const inlineMatches = [];
    while ((inlineMatch = inlineMathRegex.exec(text)) !== null) {
      // Check if this inline match is inside a block match
      const isInsideBlock = blockMatches.some(block => 
        inlineMatch.index >= block.start && inlineMatch.index < block.end
      );
      
      if (!isInsideBlock) {
        inlineMatches.push({
          type: 'inline',
          start: inlineMatch.index,
          end: inlineMatch.index + inlineMatch[0].length,
          content: inlineMatch[1].trim()
        });
      }
    }
    
    // Combine and sort all matches
    const allMatches = [...blockMatches, ...inlineMatches].sort((a, b) => a.start - b.start);
    
    // Build the result
    let currentIndex = 0;
    const result = [];
    
    allMatches.forEach((match, index) => {
      // Add text before this match
      if (currentIndex < match.start) {
        const textBefore = text.slice(currentIndex, match.start);
        if (textBefore) {
          result.push(
            <span key={`text-${index}`}>
              {formatMarkdown(textBefore)}
            </span>
          );
        }
      }
      
      // Add the math content
      try {
        if (match.type === 'block') {
          result.push(
            <div key={`block-${index}`} className="my-2">
              <BlockMath math={match.content} />
            </div>
          );
        } else {
          result.push(
            <InlineMath key={`inline-${index}`} math={match.content} />
          );
        }
      } catch (error) {
        // If LaTeX parsing fails, show the original text
        console.warn('LaTeX parsing error:', error);
        result.push(
          <span key={`error-${index}`} className="text-red-500">
            {match.type === 'block' ? `$$${match.content}$$` : `$${match.content}$`}
          </span>
        );
      }
      
      currentIndex = match.end;
    });
    
    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      if (remainingText) {
        result.push(
          <span key="remaining">
            {formatMarkdown(remainingText)}
          </span>
        );
      }
    }
    
    return result.length > 0 ? result : [formatMarkdown(text)];
  };
  
  const formatMarkdown = (text: string) => {
    // Handle basic Markdown formatting
    const parts = [];
    let lastIndex = 0;
    
    // Patterns for different markdown elements
    const patterns = [
      { regex: /\*\*(.*?)\*\*/g, type: 'bold' },
      { regex: /\*(.*?)\*/g, type: 'italic' },
      { regex: /`(.*?)`/g, type: 'code' },
      { regex: /~~(.*?)~~/g, type: 'strikethrough' },
    ];
    
    // Find all matches
    const allMatches = [];
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(text)) !== null) {
        allMatches.push({
          type: pattern.type,
          start: match.index,
          end: match.index + match[0].length,
          content: match[1],
          fullMatch: match[0]
        });
      }
    });
    
    // Sort matches by position
    allMatches.sort((a, b) => a.start - b.start);
    
    // Remove overlapping matches (keep the first one)
    const validMatches = [];
    let lastEnd = 0;
    allMatches.forEach(match => {
      if (match.start >= lastEnd) {
        validMatches.push(match);
        lastEnd = match.end;
      }
    });
    
    let currentIndex = 0;
    validMatches.forEach((match, index) => {
      // Add text before this match
      if (currentIndex < match.start) {
        const textBefore = text.slice(currentIndex, match.start);
        parts.push(formatPlainText(textBefore));
      }
      
      // Add the formatted content
      switch (match.type) {
        case 'bold':
          parts.push(<strong key={`bold-${index}`}>{match.content}</strong>);
          break;
        case 'italic':
          parts.push(<em key={`italic-${index}`}>{match.content}</em>);
          break;
        case 'code':
          parts.push(
            <code key={`code-${index}`} className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
              {match.content}
            </code>
          );
          break;
        case 'strikethrough':
          parts.push(<del key={`strike-${index}`}>{match.content}</del>);
          break;
        default:
          parts.push(match.content);
      }
      
      currentIndex = match.end;
    });
    
    // Add remaining text
    if (currentIndex < text.length) {
      const remainingText = text.slice(currentIndex);
      parts.push(formatPlainText(remainingText));
    }
    
    return parts.length > 0 ? parts : [formatPlainText(text)];
  };
  
  const formatPlainText = (text: string) => {
    // Handle line breaks
    return text.split('\n').map((line, index, array) => (
      <React.Fragment key={index}>
        {line}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ));
  };
  
  return (
    <div className={className}>
      {formatContent(content)}
    </div>
  );
}