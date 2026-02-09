'use server'

import { cache } from 'react'
import { GoogleGenAI, Type } from "@google/genai"

// Apply server-cache-react pattern: Cache AI client instance per request
const getAI = cache(() => {
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })
})

export async function generateSystemSummary(agentsCount: number, criticalAlerts: number): Promise<string> {
  try {
    const ai = getAI()
    const prompt = `Synthesize an infrastructure health audit. Agents: ${agentsCount}, Critical Alerts: ${criticalAlerts}. Provide 2 high-density professional sentences and a single directive for the SRE team.`
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt })
    return response.text || 'Summary generation offline.'
  } catch {
    throw new Error('AI Audit failed.')
  }
}

export async function generateFullReport(agentsCount: number, certsCount: number, alertsCount: number): Promise<string> {
  try {
    const ai = getAI()
    const prompt = `Generate a high-fidelity Markdown report for Oxmon SRE team. Analyze: Agents(${agentsCount}), Certs(${certsCount}), Alerts(${alertsCount}). Include: Global Health Score, Risk Matrix, and Remediation Directives.`
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt })
    return response.text || 'Report empty.'
  } catch {
    throw new Error('Synthesis failed.')
  }
}

export async function generatePredictiveMaintenance(agentNames: string[]): Promise<string> {
  try {
    const ai = getAI()
    const prompt = `Perform failure anticipation for this cluster: ${agentNames.join(', ')}. Base it on simulated health trends. Identify high-risk nodes and provide remediation advice.`
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt })
    return response.text || 'No imminent risks identified.'
  } catch {
    throw new Error('Predictive handshake failed.')
  }
}

export async function interpretCommand(input: string): Promise<{ action: string; target: string; message: string }> {
  try {
    const ai = getAI()
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Interpret intent: "${input}". Options: dashboard, agents, infrastructure, certificates, alerts, logs, tools, settings. Return JSON: { "action": "navigate", "target": "view_name", "message": "feedback" }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING },
            target: { type: Type.STRING },
            message: { type: Type.STRING }
          },
          required: ['action', 'target', 'message']
        }
      }
    })
    return JSON.parse(response.text || '{}')
  } catch {
    throw new Error('Neural translation failed.')
  }
}

export async function executeTerminalCommand(agentName: string, agentOS: string, command: string): Promise<string> {
  try {
    const ai = getAI()
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Terminal simulation for "${agentName}" on ${agentOS || 'Linux'}. Executing: "${command}". Provide professional stdout.`
    })
    return response.text || 'Success.'
  } catch {
    return 'Connection interrupt. Node heartbeat lost.'
  }
}

export async function analyzeCertificateTrust(domain: string, issuer: string, daysRemaining: number): Promise<string> {
  try {
    const ai = getAI()
    const prompt = `Perform a high-density neural security audit for domain "${domain}" issued by "${issuer}". Current state: expiring in ${daysRemaining} days. Identify trust chain vulnerabilities, cipher suite drift, and provide an SRE grade (A-F).`
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt })
    return response.text || 'Handshake synchronization empty.'
  } catch {
    throw new Error('Neural audit handshake failed.')
  }
}

export async function simulateNodeFailure(nodeName: string, nodeIp: string): Promise<string> {
  try {
    const ai = getAI()
    const prompt = `Simulate a critical node failure for "${nodeName}" (${nodeIp}). Provide a cascading risk profile for the global Oxmon mesh in 3 high-density technical bullet points.`
    const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt })
    return response.text || 'Simulation link timeout.'
  } catch {
    throw new Error('Neural sim interrupted.')
  }
}

export async function generateBriefingVideo(): Promise<{ videoUrl: string | null, error?: string }> {
  try {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return { videoUrl: null, error: 'API key not configured' }
    }

    const ai = getAI()
    const prompt = `A high-fidelity cinematic 3D macro shot of a blue glowing holographic server core in a dark, high-tech SRE facility. Data streams pulse through fibers. 8K, photorealistic, moody atmosphere.`

    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      config: { numberOfVideos: 1, resolution: '1080p', aspectRatio: '16:9' }
    })

    // Poll for completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 8000))
      operation = await ai.operations.getVideosOperation({ operation: operation })
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri
    if (downloadLink) {
      const response = await fetch(`${downloadLink}&key=${apiKey}`)
      const blob = await response.blob()
      const buffer = await blob.arrayBuffer()
      const base64 = Buffer.from(buffer).toString('base64')
      return { videoUrl: `data:video/mp4;base64,${base64}` }
    }

    return { videoUrl: null, error: 'Video generation failed' }
  } catch (error: any) {
    return { videoUrl: null, error: error.message || 'Neural synthesis link failed' }
  }
}

export async function analyzeHardwareImage(base64Data: string): Promise<string> {
  try {
    const ai = getAI()
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: base64Data, mimeType: 'image/jpeg' } },
          { text: "Act as an expert Data Center Auditor. Perform a physical infrastructure diagnostic of this hardware frame. Identify hardware models, cabling health, thermal risks, and assign a physical health grade (A-F)." }
        ]
      }
    })
    return response.text || 'Analysis failed.'
  } catch {
    throw new Error('Neural Vision handshake failed.')
  }
}

export async function generateConfig(prompt: string, harden: boolean): Promise<{ code: string; hardeningReport: string | null }> {
  try {
    const ai = getAI()
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Act as a senior Infrastructure Architect. Generate a production-ready, high-fidelity configuration for: "${prompt}". Return ONLY the code block. Include expert comments on performance.`
    })
    let code = response.text || 'Synthesis failed.'
    let hardeningReport: string | null = null

    if (harden) {
      const hardenResponse = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Act as a senior Security SRE. Perform a deep security and stability hardening audit for the following configuration. Output the hardened code block and a brief professional audit summary of changes. Original: \n${code}`
      })
      const result = hardenResponse.text || ''
      const parts = result.split('```')
      if (parts.length >= 3) {
        code = parts[1].replace(/^[a-z]+\n/, '')
        hardeningReport = parts[0] + (parts[2] || '')
      } else {
        code = result
      }
    }

    return { code, hardeningReport }
  } catch {
    throw new Error('Neural forge failure.')
  }
}

export async function searchKnowledgeBase(query: string): Promise<{ answer: string; groundingChunks: any[] }> {
  try {
    const ai = getAI()
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are the Senior SRE Advisor for the Oxmon Infrastructure Platform. Provide a technical, expert-level response for the following query: "${query}". Include grounded best practices and reference links if applicable.`,
      config: { tools: [{ googleSearch: {} }] }
    })
    return {
      answer: response.text || 'Knowledge handshake interrupted.',
      groundingChunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || []
    }
  } catch {
    return { answer: "Neural connection to the Knowledge Hub failed.", groundingChunks: [] }
  }
}

export async function generateLiveLog(): Promise<{ level: string; category: string; message: string } | null> {
  try {
    const ai = getAI()
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: 'Act as an SRE observability engine. Output a single technical monitoring log entry in JSON format for a multi-region cloud cluster. Format: { "level": "info"|"warn"|"error", "category": "auth"|"system"|"network"|"db", "message": "highly specific technical string with hex IDs" }',
      config: { responseMimeType: "application/json" }
    })
    return JSON.parse(response.text || '{}')
  } catch {
    return null
  }
}

export async function performGovernanceAudit(teamData: string, mfaEnabled: boolean, workspaceName: string): Promise<string> {
  try {
    const ai = getAI()
    const prompt = `Perform a high-fidelity governance audit for Oxmon Admin.
      Team: ${teamData}
      MFA Enabled: ${mfaEnabled}
      Workspace: ${workspaceName}
      Provide a professional security risk assessment in 3 bullet points.`
    const response = await ai.models.generateContent({ model: 'gemini-3-pro-preview', contents: prompt })
    return response.text || 'Audit concluded with no identified vulnerabilities.'
  } catch {
    throw new Error('Neural Audit handshake failed.')
  }
}
