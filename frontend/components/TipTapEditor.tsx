'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Youtube from '@tiptap/extension-youtube'
import { uploadImage } from '@/lib/api'
import { useRef } from 'react'

type Props = {
  content: string
  onChange: (html: string) => void
}

export default function TipTapEditor({ content, onChange }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false }),
      Youtube.configure({ controls: true }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  })

  if (!editor) return null

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const { url } = await uploadImage(file)
      editor?.chain().focus().setImage({ src: `${process.env.NEXT_PUBLIC_API_URL}${url}` }).run()
    } catch {
      alert('Не удалось загрузить изображение.')
    }
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function insertYoutube() {
    const url = prompt('Вставьте ссылку на YouTube-видео:')
    if (url) editor?.chain().focus().setYoutubeVideo({ src: url }).run()
  }

  const btn = (active: boolean) => `tiptap-btn${active ? ' is-active' : ''}`

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: '1px solid var(--border)' }}
    >
      {/* Тулбар */}
      <div
        className="flex flex-wrap gap-1 p-2"
        style={{ background: 'var(--surface-raised)', borderBottom: '1px solid var(--border)' }}
      >
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))}>
          <strong>Ж</strong>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))}>
          <em>К</em>
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive('strike'))}>
          <s>З</s>
        </button>

        <span style={{ width: '1px', background: 'var(--border)', margin: '2px 4px' }} />

        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive('heading', { level: 2 }))}>
          H2
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive('heading', { level: 3 }))}>
          H3
        </button>

        <span style={{ width: '1px', background: 'var(--border)', margin: '2px 4px' }} />

        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))}>
          • Список
        </button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))}>
          1. Список
        </button>

        <span style={{ width: '1px', background: 'var(--border)', margin: '2px 4px' }} />

        <button type="button" onClick={() => fileInputRef.current?.click()} className="tiptap-btn">
          🖼 Фото
        </button>
        <button type="button" onClick={insertYoutube} className="tiptap-btn">
          ▶ YouTube
        </button>

        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>

      {/* Область редактирования */}
      <EditorContent
        editor={editor}
        className="p-4 min-h-[200px]"
        style={{ background: 'var(--bg)' }}
      />
    </div>
  )
}
