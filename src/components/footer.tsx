import Link from 'next/link'
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-gray-100 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-[#003ab8] mb-4">The School of Encounter</h3>
            <p className="text-gray-600">Equipping you for spiritual growth and kingdom impact.</p>
          </div>
          <div>
            <h4 className="text-md font-semibold text-[#003ab8] mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li><Link href="/courses" className="text-gray-600 hover:text-[#003ab8]">Courses</Link></li>
              <li><Link href="/faq" className="text-gray-600 hover:text-[#003ab8]">FAQ</Link></li>
              <li><Link href="/#contact" className="text-gray-600 hover:text-[#003ab8]">Contact</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-semibold text-[#003ab8] mb-4">Legal</h4>
            <ul className="space-y-2">
              <li><Link href="/privacy" className="text-gray-600 hover:text-[#003ab8]">Privacy Policy</Link></li>
              <li><Link href="/terms" className="text-gray-600 hover:text-[#003ab8]">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-md font-semibold text-[#003ab8] mb-4">Connect With Us</h4>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-600 hover:text-[#003ab8]"><Facebook size={24} /></a>
              <a href="#" className="text-gray-600 hover:text-[#003ab8]"><Twitter size={24} /></a>
              <a href="#" className="text-gray-600 hover:text-[#003ab8]"><Instagram size={24} /></a>
              <a href="#" className="text-gray-600 hover:text-[#003ab8]"><Youtube size={24} /></a>
            </div>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-200 text-center text-gray-600">
          <p>&copy; 2023 The School of Encounter. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

