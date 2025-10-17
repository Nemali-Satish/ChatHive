import { useDispatch, useSelector } from 'react-redux'
import { setMobileSidebarOpen } from '../../redux/reducers/misc'

const AppLayout = ({ sidebar, children }) => {
  const dispatch = useDispatch()
  const { isMobileSidebarOpen } = useSelector((s) => s.misc)
  return (
    <main className="app-main">
      {/* Desktop sidebar */}
      <aside className="sidebar bg-[var(--card)] hidden md:block">
        {sidebar}
      </aside>
      <section className="min-h-0 overflow-auto p-4">{children}</section>

      {/* Mobile Drawer */}
      {isMobileSidebarOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => dispatch(setMobileSidebarOpen(false))} />
          <div className="relative z-10 h-full w-[84vw] max-w-xs bg-[var(--card)] border-r border-[color:var(--border)]">
            <div className="h-full overflow-auto">
              {sidebar}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  )
}

export default AppLayout
