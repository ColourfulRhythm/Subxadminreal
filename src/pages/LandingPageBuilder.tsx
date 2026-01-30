import { useState, useRef } from 'react'
import { 
  Plus, 
  Save, 
  Eye, 
  Download, 
  Trash2, 
  Move, 
  Settings,
  Type,
  Image as ImageIcon,
  Layout,
  Palette,
  Smartphone,
  Monitor,
  Zap,
  FileText,
  MousePointer,
  Layers,
  ArrowLeft,
  type LucideIcon
} from 'lucide-react'

interface Block {
  id: string
  type: 'hero' | 'text' | 'image' | 'cta' | 'testimonial' | 'pricing' | 'contact' | 'gallery'
  props: Record<string, any>
  position: number
}

type BlockType = Block['type']

interface LandingPage {
  id?: string
  name: string
  title: string
  slug: string
  description: string
  status: 'draft' | 'published'
  blocks: Block[]
  meta?: {
    ogImage: string
    description: string
    keywords: string[]
  }
  design?: {
    primaryColor: string
    backgroundColor: string
    font: string
    headingSize: 'small' | 'medium' | 'large' | 'x-large'
  }
  createdAt?: Date
  updatedAt?: Date
}

const LANDING_PAGE_TEMPLATES = [
  {
    name: "Real Estate Hero",
    preview: "🏡",
    description: "Classic hero section for real estate sales",
    blocks: [
      { type: 'hero', props: { 
        title: 'Premium Real Estate Investments',
        subtitle: 'Invest in the future with our carefully selected properties',
        ctaText: 'Explore Properties',
        backgroundImage: '/hero-real-estate.jpg'
      }},
      { type: 'testimonial', props: {
        quote: 'This investment opportunity is unmatched. I\'ve never seen such quality.',
        author: 'Sarah Johnson',
        role: 'Property Investor',
        image: '/testimonial-1.jpg'
      }}
    ]
  },
  {
    name: "Investment Focused",
    preview: "💰",
    description: "Highlight investment opportunities",
    blocks: [
      { type: 'hero', props: { 
        title: 'Real Estate Investment Platform',
        subtitle: 'Maximize your returns with our curated investment opportunities',
        ctaText: 'Start Investing',
        backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }},
      { type: 'pricing', props: {
        title: 'Investment Plans',
        plans: [
          { name: 'Starter', price: 25000, features: ['Property access', 'Basic support', 'Monthly updates'] },
          { name: 'Premium', price: 100000, features: ['All properties', 'Priority support', '1-on-1 consultation', 'Annual return reports'] },
          { name: 'VIP', price: 500000, features: ['Exclusive properties', 'Personal advisor', 'Custom portfolios', 'Early access to deals'] }
        ]
      }},
      { type: 'cta', props: {
        text: 'Ready to start your investment journey?',
        buttonText: 'Get Started Today',
        backgroundColor: '#10B981',
        textColor: '#FFFFFF'
      }}
    ]
  },
  {
    name: "Portfolio Showcase",
    preview: "📸",
    description: "Display current projects and developments",
    blocks: [
      { type: 'hero', props: { 
        title: 'Our Property Portfolio',
        subtitle: 'Discover our carefully selected real estate investments',
        ctaText: 'View Properties'
      }},
      { type: 'gallery', props: {
        title: 'Featured Properties',
        layout: 'grid',
        images: ['/property-1.jpg', '/property-2.jpg', '/property-3.jpg']
      }},
      { type: 'testimonial', props: {
        quote: 'Every property we\'ve purchased through them has exceeded our expectations.',
        author: 'Michael Chen',
        role: 'Portfolio Manager'
      }}
    ]
  },
  {
    name: "Referral Generator",
    preview: "🎯",
    description: "Optimized for referral campaigns",
    blocks: [
      { type: 'hero', props: { 
        title: 'Join Our Investment Community',
        subtitle: 'Refer friends and earn commissions on every investment they make',
        ctaText: 'Start Referring',
        image: '/referral-hero.jpg'
      }},
      { type: 'text', props: {
        content: 'Earn 2.5% commission for every friend you refer who makes an investment. There\'s no limit to what you can earn!',
        size: 'large',
        align: 'center'
      }},
      { type: 'cta', props: {
        text: 'Get your unique referral link and start earning today',
        buttonText: 'Get Referral Link',
        backgroundColor: '#F59E0B',
        textColor: '#FFFFFF'
      }}
    ]
  }
] satisfies Array<{
  name: string
  preview: string
  description: string
  blocks: Array<{ type: BlockType; props: Record<string, any> }>
}>

const BLOCK_TYPES = [
  { type: 'hero', icon: Layout, label: 'Hero Section' },
  { type: 'text', icon: Type, label: 'Text Block' },
  { type: 'image', icon: ImageIcon, label: 'Image' },
  { type: 'cta', icon: Zap, label: 'Call to Action' },
  { type: 'testimonial', icon: FileText, label: 'Testimonial' },
  { type: 'pricing', icon: Layers, label: 'Pricing Table' },
  { type: 'contact', icon: MousePointer, label: 'Contact Form' },
  { type: 'gallery', icon: ImageIcon, label: 'Image Gallery' }
] satisfies Array<{ type: BlockType; icon: LucideIcon; label: string }>

export default function LandingPageBuilder() {
  const [selectedPage, setSelectedPage] = useState<LandingPage | null>(null)
  const [pages, setPages] = useState<LandingPage[]>([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [showDesignPanel, setShowDesignPanel] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop')

  const blockCounterRef = useRef(0)

  const createNewPage = () => {
    const newPage: LandingPage = {
      name: 'New Landing Page',
      title: '',
      slug: '',
      description: '',
      status: 'draft',
      blocks: [],
      design: {
        primaryColor: '#3B82F6',
        backgroundColor: '#FFFFFF',
        font: 'Inter',
        headingSize: 'medium'
      }
    }
    setSelectedPage(newPage)
    setPages([...pages, newPage])
    setShowTemplateModal(true)
  }

  const addBlock = (type: Block['type']) => {
    if (!selectedPage) return

    const block: Block = {
      id: `block_${++blockCounterRef.current}`,
      type,
      props: getDefaultBlockProps(type),
      position: selectedPage.blocks.length
    }

    setSelectedPage({
      ...selectedPage,
      blocks: [...selectedPage.blocks, block]
    })
  }

  const getDefaultBlockProps = (type: Block['type']) => {
    switch (type) {
      case 'hero':
        return {
          title: 'Your Real Estate Dream Starts Here',
          subtitle: 'Discover premium properties and investment opportunities',
          image: '',
          ctaText: 'Get Started',
          ctaLink: '#contact'
        }
      case 'text':
        return {
          content: 'Add your content here...',
          size: 'medium',
          align: 'left'
        }
      case 'image':
        return {
          src: '',
          alt: 'Description',
          width: '100%',
          height: 'auto'
        }
      case 'cta':
        return {
          text: 'Join Our Investment Program',
          buttonText: 'Start Investing',
          buttonLink: '#signup',
          backgroundColor: '#3B82F6',
          textColor: '#FFFFFF'
        }
      case 'testimonial':
        return {
          quote: 'This investment changed my life!',
          author: 'John Doe',
          role: 'Real Estate Investor',
          image: ''
        }
      case 'pricing':
        return {
          title: 'Investment Plans',
          plans: [
            { name: 'Starter', price: 25000, features: ['Property access', 'Basic support'] },
            { name: 'Premium', price: 100000, features: ['All properties', 'Priority support', 'Consultation'] }
          ]
        }
      case 'contact':
        return {
          title: 'Get In Touch',
          fields: ['name', 'email', 'phone', 'message']
        }
      case 'gallery':
        return {
          title: 'Property Gallery',
          images: [],
          layout: 'grid'
        }
      default:
        return {}
    }
  }

  const updateBlock = (blockId: string, updates: Partial<Block>) => {
    if (!selectedPage) return

    setSelectedPage({
      ...selectedPage,
      blocks: selectedPage.blocks.map(block => 
        block.id === blockId ? { ...block, ...updates } : block
      )
    })
  }

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    if (!selectedPage) return

    const blocks = [...selectedPage.blocks]
    const currentIndex = blocks.findIndex(b => b.id === blockId)
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    if (newIndex >= 0 && newIndex < blocks.length) {
      [blocks[currentIndex], blocks[newIndex]] = [blocks[newIndex], blocks[currentIndex]]
      setSelectedPage({ ...selectedPage, blocks })
    }
  }

  const deleteBlock = (blockId: string) => {
    if (!selectedPage) return

    setSelectedPage({
      ...selectedPage,
      blocks: selectedPage.blocks.filter(block => block.id !== blockId)
    })
  }

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile': return 375
      case 'tablet': return 768
      default: return 1200
    }
  }

  const renderBlock = (block: Block) => {
    const isSelected = selectedBlock === block.id

    const getBlockComponent = () => {
      switch (block.type) {
        case 'hero':
          return (
            <div className="relative h-96 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg">
              <div className="absolute inset-0 bg-opacity-50 bg-black rounded-lg"></div>
              <div className="relative z-10 p-8 h-full flex flex-col justify-center">
                <h1 className="text-4xl font-bold mb-4">{block.props.title || 'Hero Title'}</h1>
                <p className="text-xl mb-6">{block.props.subtitle || 'Hero subtitle'}</p>
                <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                  {block.props.ctaText || 'Get Started'}
                </button>
              </div>
            </div>
          )
        case 'text':
          return (
            <div className="p-6">
              <p className={`text-${block.props.size || 'medium'} text-align-${block.props.align || 'left'}`}>
                {block.props.content || 'Your text content...'}
              </p>
            </div>
          )
        case 'image':
          return (
            <div className="w-full">
              <img 
                src={block.props.src || 'placeholder-image.jpg'} 
                alt={block.props.alt || 'Description'}
                className="w-full h-auto rounded-lg"
              />
            </div>
          )
        case 'cta':
          return (
            <div 
              className="p-8 rounded-lg"
              style={{ backgroundColor: block.props.backgroundColor || '#3B82F6' }}
            >
              <h3 className="text-white text-2xl font-bold mb-4">{block.props.text || 'Call to Action'}</h3>
              <button className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition">
                {block.props.buttonText || 'Get Started'}
              </button>
            </div>
          )
        case 'testimonial':
          return (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <p className="text-xl italic mb-4">"{block.props.quote || 'Customer testimonial...'}"</p>
              <div className="flex items-center justify-center">
                <div className="text-center">
                  <img 
                    src={block.props.image || 'demo-avatar.jpg'} 
                    alt={block.props.author || 'Customer'} 
                    className="w-16 h-16 rounded-full mx-auto mb-2"
                  />
                  <h4 className="font-semibold">{block.props.author || 'John Doe'}</h4>
                  <p className="text-gray-600 text-sm">{block.props.role || 'Customer'}</p>
                </div>
              </div>
            </div>
          )
        case 'pricing':
          return (
            <div className="p-8">
              <h3 className="text-2xl font-bold text-center mb-8">{block.props.title || 'Pricing Plans'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(block.props.plans || []).map((plan: any, index: number) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-6 text-center">
                    <h4 className="text-xl font-semibold mb-2">{plan.name || 'Plan Name'}</h4>
                    <p className="text-3xl font-bold mb-4">{plan.price ? `₦${plan.price.toLocaleString()}` : 'Price'}</p>
                    <ul className="space-y-2 text-sm">
                      {(plan.features || []).map((feature: string, fIndex: number) => (
                        <li key={fIndex} className="flex items-center">
                          <span className="text-green-500 mr-2">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )
        case 'contact':
          return (
            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-6">{block.props.title || 'Contact Us'}</h3>
              <form className="space-y-4">
                {['name', 'email', 'phone'].map(field => (
                  <input
                    key={field}
                    type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
                    placeholder={field === 'name' ? 'Name' : field === 'email' ? 'Email' : 'Phone'}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  />
                ))}
                <textarea
                  placeholder="Message"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg h-24 resize-none"
                ></textarea>
                <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                  Send Message
                </button>
              </form>
            </div>
          )
        default:
          return <div className="p-4 bg-gray-100 rounded">Unknown block type</div>
      }
    }

    return (
      <div 
        className={`relative group hover:border-blue-300 transition-all ${isSelected ? 'border-blue-500 border-2' : 'border border-transparent'} rounded-lg cursor-pointer`}
        onClick={() => setSelectedBlock(block.id)}
        onMouseEnter={() => setSelectedBlock(block.id)}
      >
        {isSelected && (
          <div className="flex space-x-2 absolute -top-10 right-2 bg-white border shadow-lg rounded-lg p-2">
            <button
              onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'up') }}
              className="p-1 hover:bg-gray-100 rounded"
              title="Move Up"
            >
              <Move className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); moveBlock(block.id, 'down') }}
              className="p-1 hover:bg-gray-100 rounded"
              title="Move Down"
            >
              <Move className="h-4 w-4 rotate-180" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); window.open(`#block-${block.id}-settings`, '_self') }}
              className="p-1 hover:bg-gray-100 rounded"
              title="Settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteBlock(block.id) }}
              className="p-1 hover:bg-red-100 text-red-600 rounded"
              title="Delete"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
        {getBlockComponent()}
      </div>
    )
  }

  if (showPreview && selectedPage) {
    return (
      <div className="bg-gray-100 min-h-screen">
        <div className="fixed top-4 left-4 z-50 flex space-x-3">
          <button
            onClick={() => setShowPreview(false)}
            className="bg-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Editor</span>
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            <Download className="h-4 w-4" />
            Download
          </button>
        </div>

        <div className="max-w-6xl mx-auto pt-16">
          {selectedPage.blocks.map(block => (
            <div key={block.id} className="mb-4">
              {renderBlock(block)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Landing Page Builder</h1>
          <p className="text-gray-600">Create high-converting landing pages for your real estate campaigns</p>
        </div>
        <div className="flex space-x-3">
          {selectedPage && (
            <>
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Eye className="h-4 w-4" />
                <span>Preview</span>
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <Save className="h-4 w-4" />
                <span>Publish</span>
              </button>
            </>
          )}
          <button
            onClick={createNewPage}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Plus className="h-4 w-4" />
            <span>New Page</span>
          </button>
        </div>
      </div>

      {!selectedPage ? (
        /* Landing Pages List */
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Your Landing Pages</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pages.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <Layout className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No landing pages yet</h3>
                <p className="text-gray-500 mb-4">Create your first landing page to start building</p>
                <button
                  onClick={createNewPage}
                  className="btn-primary"
                >
                  Create Your First Page
                </button>
              </div>
            ) : (
              pages.map(page => (
                <div
                  key={page.name}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition"
                  onClick={() => setSelectedPage(page)}
                >
                  <h3 className="font-semibold text-gray-900">{page.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{page.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className={`px-2 py-1 text-xs rounded ${page.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {page.status}
                    </span>
                    <span className="text-xs text-gray-400">{page.blocks.length} blocks</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Page Builder Interface */
        <div className="flex h-screen bg-gray-50">
          {/* Left Sidebar - Components */}
          <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-4">Components</h3>
              <div className="grid grid-cols-2 gap-2">
                {BLOCK_TYPES.map(({ type, icon: Icon, label }) => (
                  <button
                    key={type}
                    onClick={() => addBlock(type)}
                    className="flex flex-col items-center space-y-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                  >
                    <Icon className="h-6 w-6 text-blue-600" />
                    <span className="text-xs text-center">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Design</h3>
              <button
                onClick={() => setShowDesignPanel(true)}
                className="w-full flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
              >
                <Palette className="h-5 w-5 text-purple-600" />
                <span>Theme Settings</span>
              </button>
            </div>

            <div className="p-4 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Device View</h3>
              <div className="flex space-x-2">
                {[
                  { type: 'desktop', label: 'Desktop', icon: Monitor },
                  { type: 'tablet', label: 'Tablet', icon: Smartphone },
                  { type: 'mobile', label: 'Mobile', icon: Smartphone }
                ].map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    onClick={() => setViewport(type as 'desktop' | 'tablet' | 'mobile')}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm ${
                      viewport === type ? 'bg-blue-100 text-blue-700' : 'text-gray-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Center - Canvas */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center space-x-4">
                <h2 className="font-semibold text-gray-900">{selectedPage.name}</h2>
                <span className={`px-2 py-1 text-xs rounded ${selectedPage.status === 'published' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {selectedPage.status}
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-500">
                  {selectedPage.blocks.length} blocks
                </span>
                <input
                  type="text"
                  placeholder="Page title..."
                  value={selectedPage.title}
                  onChange={(e) => setSelectedPage({ ...selectedPage, title: e.target.value })}
                  className="px-3 py-1 border border-gray-300 rounded text-sm"
                />
              </div>
            </div>

            <div 
              className="flex-1 bg-gray-100 p-6 overflow-y-auto"
              style={{
                minHeight: `calc(100vh - 140px)`
              }}
            >
              <div 
                className="mx-auto bg-white rounded-lg shadow-lg"
                style={{ 
                  width: `${Math.min(getViewportWidth(), 1200)}px`,
                  minHeight: '800px'
                }}
              >
                {selectedPage.blocks.length === 0 ? (
                  <div className="flex items-center justify-center h-96">
                    <div className="text-center">
                      <Layout className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Start building your page</h3>
                      <p className="text-gray-500">Choose components from the sidebar to begin</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 p-6">
                    {selectedPage.blocks.map(block => (
                      <div key={block.id}>
                        {renderBlock(block)}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Sidebar - Properties Panel (if block is selected) */}
          {selectedBlock && (
            <div className="w-80 bg-white border-l border-gray-200">
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Block Properties</h3>
                {(() => {
                  const block = selectedPage?.blocks.find(b => b.id === selectedBlock)
                  if (!block) return <div>Block not found</div>

                  return (
                    <div className="space-y-4">
                      {Object.entries(block.props).map(([key, value]) => (
                        <div key={key}>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
                          </label>
                          <input
                            type="text"
                            value={typeof value === 'string' ? value : JSON.stringify(value)}
                            onChange={(e) => {
                              const updatedBlock = { ...block, props: { ...block.props, [key]: e.target.value } }
                              updateBlock(block.id, updatedBlock)
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Template Selection Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Choose a Template</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {LANDING_PAGE_TEMPLATES.map((template, index) => (
              <button
                key={index}
                onClick={() => {
                  // Apply template to current page
                  if (selectedPage && template.blocks) {
                    const templateBlocks = template.blocks.map((blockTemplate, blockIndex) => ({
                      id: `block_${++blockCounterRef.current}`,
                      type: blockTemplate.type,
                      props: blockTemplate.props,
                      position: blockIndex
                    }))
                    
                    setSelectedPage({
                      ...selectedPage,
                      blocks: templateBlocks
                    })
                  }
                  setShowTemplateModal(false)
                }}
                className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                disabled={!selectedPage}
              >
                  <span className="text-4xl mb-2">{template.preview}</span>
                  <h4 className="font-semibold">{template.name}</h4>
                  <p className="text-sm text-gray-500 text-center">{template.description}</p>
                </button>
              ))}
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowTemplateModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                Start from Scratch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Design Panel Modal (minimal implementation to avoid dead UI button) */}
      {showDesignPanel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Theme Settings</h3>
              <button
                onClick={() => setShowDesignPanel(false)}
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm"
              >
                Close
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Theme customization is wired for future expansion. (This modal keeps the “Design” button functional and prevents runtime dead-ends.)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
