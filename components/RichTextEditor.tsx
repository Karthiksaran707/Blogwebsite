import React, { useRef, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { uploadFile } from '../utils/api';
import { toast } from 'sonner';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const quillRef = useRef<ReactQuill>(null);

  // Image upload handler
  const imageHandler = async () => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      try {
        toast.loading('Uploading image...');
        const result = await uploadFile(file);
        
        // Insert image into editor
        const quill = quillRef.current?.getEditor();
        if (quill) {
          const range = quill.getSelection(true);
          quill.insertEmbed(range.index, 'image', result.url);
          quill.setSelection(range.index + 1, 0);
        }
        
        toast.dismiss();
        toast.success('Image uploaded!');
      } catch (error: any) {
        toast.dismiss();
        console.error('Image upload error:', error);
        toast.error(error.message || 'Failed to upload image');
      }
    };
  };

  // Quill modules configuration
  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          // Font family and size
          [{ font: [] }],
          [{ size: ['small', false, 'large', 'huge'] }],
          
          // Text formatting
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          
          // Paragraph formatting
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          [{ align: [] }],
          
          // Lists and indentation
          [{ list: 'ordered' }, { list: 'bullet' }],
          [{ indent: '-1' }, { indent: '+1' }],
          
          // Superscript/subscript
          [{ script: 'sub' }, { script: 'super' }],
          
          // Blockquote and code
          ['blockquote', 'code-block'],
          
          // Links and images
          ['link', 'image'],
          
          // Clear formatting
          ['clean'],
        ],
        handlers: {
          image: imageHandler,
        },
      },
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  // Quill formats
  const formats = [
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'color',
    'background',
    'header',
    'align',
    'list',
    'bullet',
    'indent',
    'script',
    'blockquote',
    'code-block',
    'link',
    'image',
  ];

  return (
    <div className="rich-text-editor">
      <ReactQuill
        ref={quillRef}
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder || 'Write your post content here...'}
      />
    </div>
  );
}
