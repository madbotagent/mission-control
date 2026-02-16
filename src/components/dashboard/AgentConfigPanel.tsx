"use client"

import { Agent } from "@/lib/types"
import { Settings, Wrench } from "lucide-react"

export default function AgentConfigPanel({ agents }: { agents: Agent[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary" />
        Agent Configuration
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {agents.map(agent => (
          <div key={agent.id} className="bg-card border border-border rounded-lg p-4 animate-slide-in">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{agent.emoji}</span>
              <div>
                <div className="font-semibold">{agent.name}</div>
                <div className="text-xs text-muted-foreground">ID: {agent.id}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Model</label>
                <input
                  defaultValue={agent.model}
                  className="w-full bg-muted border border-border rounded px-3 py-1.5 text-sm text-foreground"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Workspace</label>
                <input
                  defaultValue={agent.workspace}
                  className="w-full bg-muted border border-border rounded px-3 py-1.5 text-sm text-foreground font-mono"
                />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-muted-foreground block mb-1 flex items-center gap-1">
                  <Wrench className="w-3 h-3" /> Tools
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {agent.tools.map(tool => (
                    <span key={tool} className="text-xs bg-muted px-2 py-1 rounded font-mono">{tool}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
