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
      <button className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-sm font-medium" onClick={() => setOpen(true)}>
        Details
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex gap-2 border-b border-gray-200">
                <button
                  className={`px-4 py-2 -mb-px border-b-2 focus:outline-none transition ${
                    tab === 'request'
                      ? 'border-blue-600 text-blue-600 font-semibold'
                      : 'border-transparent text-gray-600 hover:text-blue-600 hover:border-blue-600'
                  }`}
                  onClick={() => setTab('request')}
                >
                  Request
                </button>
                <button
                  className={`px-4 py-2 -mb-px border-b-2 focus:outline-none transition ${
                    tab === 'response'
                      ? 'border-blue-600 text-blue-600 font-semibold'
                      : 'border-transparent text-gray-600 hover:text-blue-600 hover:border-blue-600'
                  }`}
                  onClick={() => setTab('response')}
                >
                  Response
                </button>
              </div>
              <button className="text-gray-500 hover:text-gray-700 text-xl font-bold" onClick={() => setOpen(false)}>&times;</button>
            </div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2">Headers:</h3>
              <div className="rounded-md overflow-hidden bg-gray-50 text-black p-4 text-xs font-mono overflow-x-auto">
                <pre className="whitespace-pre-wrap"><code>{JSON.stringify(activeHeaders, null, 2)}</code></pre>
              </div>
            </div>
            {tab === "response" ? <div>
              <h3 className="text-sm font-semibold mb-2">Body:</h3>
              <div className="rounded-md overflow-hidden bg-white text-black p-4 text-xs font-mono overflow-x-auto">
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
