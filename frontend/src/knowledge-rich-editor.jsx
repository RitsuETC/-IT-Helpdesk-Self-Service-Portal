import { useEffect, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import { Bold, Heading2, Italic, Link2, List, ListOrdered, Quote } from 'lucide-react'

function EditorTool({ label, active, onClick, children }) {
  return (
    <button type="button" className={`kb-editor-tool${active ? ' active' : ''}`} aria-label={label} title={label} onClick={onClick}>
      {children}
    </button>
  )
}

export default function KnowledgeRichEditor({ value, onChange }) {
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange }, [onChange])

  const editor = useEditor({
    extensions: [StarterKit.configure({ link: false }), Link.configure({ openOnClick: false, autolink: true, defaultProtocol: 'https' })],
    content: value,
    onUpdate: ({ editor: currentEditor }) => onChangeRef.current(currentEditor.getHTML()),
  }, [])

  useEffect(() => {
    if (editor && editor.getHTML() !== value) editor.commands.setContent(value, { emitUpdate: false })
  }, [editor, value])

  const addLink = () => {
    if (!editor) return
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, ' ').trim()
    const activeLink = editor.isActive('link')
    const existing = editor.getAttributes('link').href || ''
    const url = window.prompt('Masukkan URL tautan', existing)
    if (url === null) return
    const value = url.trim()
    if (!value) {
      if (activeLink || selectedText) editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }

    const href = /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`
    let parsedUrl
    try {
      parsedUrl = new URL(href)
    } catch {
      window.alert('URL tidak valid. Gunakan alamat seperti https://contoh.com.')
      return
    }
    if (!['http:', 'https:', 'mailto:'].includes(parsedUrl.protocol)) {
      window.alert('Tipe URL ini tidak didukung.')
      return
    }

    if (activeLink || selectedText) {
      editor.chain().focus().extendMarkRange('link').setLink({ href: parsedUrl.href }).run()
      return
    }

    editor.chain().focus().insertContent({
      type: 'text',
      text: value,
      marks: [{ type: 'link', attrs: { href: parsedUrl.href } }],
    }).run()
  }

  if (!editor) return <div className="kb-editor-loading">Memuat editor artikel...</div>

  return (
    <div className="kb-rich-editor">
      <div className="kb-editor-toolbar" role="toolbar" aria-label="Pemformatan artikel">
        <EditorTool label="Tebal" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={16} /></EditorTool>
        <EditorTool label="Miring" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={16} /></EditorTool>
        <EditorTool label="Judul bagian" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={16} /></EditorTool>
        <EditorTool label="Daftar poin" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={16} /></EditorTool>
        <EditorTool label="Daftar bernomor" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></EditorTool>
        <EditorTool label="Kutipan" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={16} /></EditorTool>
        <EditorTool label="Tautan" active={editor.isActive('link')} onClick={addLink}><Link2 size={16} /></EditorTool>
      </div>
      <EditorContent editor={editor} className="kb-editor-content" />
    </div>
  )
}
