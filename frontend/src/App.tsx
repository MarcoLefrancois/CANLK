/**
 * CANLK Application Principale
 * 
 * @version Sprint 7 | 2026-03-15
 * @agent front_nexus
 */

import { useState } from 'react'
import { TDLForm } from '@/components/TDLForm'
import { MasterDashboard } from '@/components/master'
import { IntervenantsConfig } from '@/components/config'
import { HypercareDashboard } from '@/components/hypercare'
import { SacNotification, TrainingPlan } from '@/components/notifications'
import { 
  FileText, 
  Send, 
  LayoutDashboard, 
  Users, 
  LifeBuoy,
  BookOpen,
  Bell
} from 'lucide-react'

type View = 'form' | 'dashboard' | 'intervenants' | 'hypercare' | 'training' | 'notifications'

function App() {
  const [currentView, setCurrentView] = useState<View>('form')

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <MasterDashboard />
      case 'intervenants':
        return <IntervenantsConfig />
      case 'hypercare':
        return <HypercareDashboard />
      case 'training':
        return (
          <div className="max-w-4xl mx-auto">
            <TrainingPlan />
          </div>
        )
      case 'notifications':
        return (
          <div className="max-w-2xl mx-auto">
            <SacNotification />
          </div>
        )
      default:
        return <TDLForm onSubmit={(data) => console.log('Soumission TDL:', data)} />
    }
  }

  const navItems = [
    { id: 'form' as View, label: 'Nouveau TDL', icon: FileText },
    { id: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'notifications' as View, label: 'Notifications', icon: Bell },
    { id: 'intervenants' as View, label: 'Intervenants', icon: Users },
    { id: 'training' as View, label: 'Formation', icon: BookOpen },
    { id: 'hypercare' as View, label: 'Support', icon: LifeBuoy },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-slate-900 text-white shadow-lg">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔬</span>
              <span className="font-bold text-xl">CANLK</span>
              <span className="text-xs text-slate-400 ml-2">v4.6.0</span>
            </div>
            <div className="flex gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentView(item.id)}
                    className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                      currentView === item.id
                        ? 'bg-sky-600 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                    title={item.label}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {renderView()}
      </div>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white border-t py-2 text-center text-sm text-gray-500">
        CANLK v4.6.0 • A-SPEC-CODEX Autonomy Mode • {new Date().getFullYear()}
      </footer>
    </div>
  )
}

export default App
