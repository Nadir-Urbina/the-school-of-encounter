'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prevState => ({ ...prevState, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Form submitted:', formData)
    setFormData({ name: '', email: '', message: '' })
    alert('Thank you for your message. We will get back to you soon!')
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto space-y-6">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <Input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="w-full"
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <Input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="w-full"
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <Textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          className="w-full h-32"
        />
      </div>
      <Button type="submit" className="w-full bg-[#003ab8] text-white hover:bg-[#002a85]">
        Send Message
      </Button>
    </form>
  )
} 