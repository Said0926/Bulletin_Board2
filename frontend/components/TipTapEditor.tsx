'use client'

// Rich-text редактор на базе TipTap.
// Поддерживает: жирный/курсив/подчёркивание, заголовки, списки, изображения, YouTube-видео.

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
    // Сбрасываем input чтобы можно было загрузить тот же файл повторно
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  function insertYoutube() {
    const url = prompt('Вставьте ссылку на YouTube-видео:')
    if (url) editor?.chain().focus().setYoutubeVideo({ src: url }).run()
  }

  const btnClass = (active: boolean) =>
    `px-2 py-1 text-sm rounded border ${
      active ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 hover:bg-gray-100'
    }`

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Панель инструментов */}
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200">
        <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={btnClass(editor.isActive('bold'))}>Ж</button>
        <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={btnClass(editor.isActive('italic'))}>К</button>
        <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} className={btnClass(editor.isActive('strike'))}>S̶</button>
        <span className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btnClass(editor.isActive('heading', { level: 2 }))}>H2</button>
        <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btnClass(editor.isActive('heading', { level: 3 }))}>H3</button>
        <span className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={btnClass(editor.isActive('bulletList'))}>• Список</button>
        <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btnClass(editor.isActive('orderedList'))}>1. Список</button>
        <span className="w-px bg-gray-300 mx-1" />
        <button type="button" onClick={() => fileInputRef.current?.click()} className="px-2 py-1 text-sm rounded border border-gray-300 hover:bg-gray-100">
          🖼 Фото
        </button>
        <button type="button" onClick={insertYoutube} className="px-2 py-1 text-sm rounded border border-gray-300 hover:bg-gray-100">
          ▶ YouTube
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
      </div>

      {/* Область редактирования */}
      <EditorContent
        editor={editor}
        className="prose prose-sm max-w-none p-4 min-h-[200px] focus-within:outline-none"
      />
    </div>
  )
}
