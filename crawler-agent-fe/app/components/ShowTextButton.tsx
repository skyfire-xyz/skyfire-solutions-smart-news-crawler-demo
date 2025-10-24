import { useState } from "react"

interface ShowTextButtonProps {
  request: {
    headers?: Record<string, string>
    text?: string
    url?: string
  }
  response: {
    headers?: Record<string, string>
    text?: string
    url?: string
  }
}

// Simple HTML/XML formatter for readability
function formatHtml(html: string): string {
  const tab = '  ';
  let result = '';
  let indent = '';
  html
    .replace(/>\s*</g, '><') // Remove whitespace between tags
    .replace(/</g, '\n<') // Newline before each tag
    .split('\n')
    .filter(line => line.trim())
    .forEach(line => {
      if (line.match(/^<\//)) indent = indent.slice(0, -tab.length);
      result += indent + line + '\n';
      if (line.match(/^<[^!?/][^>]*[^/]?>$/)) indent += tab;
    });
  return result.trim();
}

const ShowTextButton: React.FC<ShowTextButtonProps> = ({ request, response }) => {
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState<'request' | 'response'>('response')

  const active = tab === 'request' ? request : response
  const activeHeaders = active?.headers || {}
  const activeText = active?.text || ''

  return (
    <>
      <button className="rounded bg-gray-200 px-3 py-1 text-sm font-medium hover:bg-gray-300" onClick={() => setOpen(true)}>
        Details
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="max-h-[80vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex gap-2 border-b border-gray-200">
                <button
                  className={`-mb-px border-b-2 px-4 py-2 transition focus:outline-none ${
                    tab === 'request'
                      ? 'border-blue-600 font-semibold text-blue-600'
                      : 'border-transparent text-gray-600 hover:border-blue-600 hover:text-blue-600'
                  }`}
                  onClick={() => setTab('request')}
                >
                  Request
                </button>
                <button
                  className={`-mb-px border-b-2 px-4 py-2 transition focus:outline-none ${
                    tab === 'response'
                      ? 'border-blue-600 font-semibold text-blue-600'
                      : 'border-transparent text-gray-600 hover:border-blue-600 hover:text-blue-600'
                  }`}
                  onClick={() => setTab('response')}
                >
                  Response
                </button>
              </div>
              <button className="text-xl font-bold text-gray-500 hover:text-gray-700" onClick={() => setOpen(false)}>&times;</button>
            </div>
            <div className="mb-4">
              <h3 className="mb-2 text-sm font-semibold">Headers:</h3>
              <div className="overflow-hidden overflow-x-auto rounded-md bg-gray-50 p-4 font-mono text-xs text-black">
                <pre className="whitespace-pre-wrap"><code>{JSON.stringify(activeHeaders, null, 2)}</code></pre>
              </div>
            </div>
            {tab === "response" ? <div>
              <h3 className="mb-2 text-sm font-semibold">Body:</h3>
              <div className="overflow-hidden overflow-x-auto rounded-md bg-white p-4 font-mono text-xs text-black">
                <pre className="whitespace-pre-wrap"><code>{formatHtml(activeText)}</code></pre>
              </div>
            </div> : <div></div>}
            
          </div>
        </div>
      )}
    </>
  )
}

export default ShowTextButton
