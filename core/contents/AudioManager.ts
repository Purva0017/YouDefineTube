import type { Settings } from "~/lib/settings"

export class AudioManager {
  private audioCtx: AudioContext | null = null
  private sourceMap = new WeakMap<HTMLVideoElement, {
    source: MediaElementAudioSourceNode
    gainNode: GainNode
    highpassFilter: BiquadFilterNode
    peakingFilter: BiquadFilterNode
  }>()
  private settings: Settings | null = null

  constructor() {
    this.setupListeners()
  }

  private setupListeners() {
    // Capture play events to hook new video elements
    document.addEventListener("play", (e) => {
      if (e.target instanceof HTMLVideoElement) {
        this.checkAndHookVideo(e.target)
      }
    }, true)

    // Capture user gestures to resume AudioContext if suspended
    const resumeHandler = () => this.resumeContext()
    document.addEventListener("click", resumeHandler, true)
    document.addEventListener("keydown", resumeHandler, true)
  }

  private resumeContext() {
    if (this.audioCtx && this.audioCtx.state === "suspended") {
      this.audioCtx.resume().catch((err) => {
        console.warn("Failed to resume AudioContext:", err)
      })
    }
  }

  public init() {
    // Check initial videos
    const videos = document.querySelectorAll("video")
    videos.forEach((video) => this.checkAndHookVideo(video))
  }

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      this.audioCtx = new AudioContextClass()
    }
    return this.audioCtx
  }

  private checkAndHookVideo(video: HTMLVideoElement) {
    if (!this.settings) return

    const hasActiveBoost = this.settings.isExtensionEnabled && 
      ((this.settings.audioVolumeBoost ?? 100) > 100 || (this.settings.audioVocalBoost ?? false))

    // Only hook the video if the user actually has active boost settings enabled
    if (hasActiveBoost) {
      this.hookVideo(video)
    }
  }

  private hookVideo(video: HTMLVideoElement) {
    if (this.sourceMap.has(video)) {
      if (!video.paused) {
        this.resumeContext()
      }
      return
    }

    try {
      const ctx = this.getAudioContext()
      
      // Create Web Audio nodes
      const source = ctx.createMediaElementSource(video)
      const gainNode = ctx.createGain()
      const highpassFilter = ctx.createBiquadFilter()
      const peakingFilter = ctx.createBiquadFilter()

      // Configure highpass filter: cut low rumble under 150 Hz
      highpassFilter.type = "highpass"
      highpassFilter.frequency.value = 150
      highpassFilter.Q.value = 1.0

      // Configure peaking filter: boost core speech presence at 2000 Hz by 6dB
      peakingFilter.type = "peaking"
      peakingFilter.frequency.value = 2000
      peakingFilter.Q.value = 1.0
      peakingFilter.gain.value = 6.0

      this.sourceMap.set(video, {
        source,
        gainNode,
        highpassFilter,
        peakingFilter
      })

      this.updateVideoNodes(video)

      if (!video.paused) {
        this.resumeContext()
      }
    } catch (err) {
      // In some cases (like if another script already called createMediaElementSource), this can fail.
      // We catch it gracefully to not break other page functionalities.
      console.warn("Could not hook YouTube video audio:", err)
    }
  }

  private updateVideoNodes(video: HTMLVideoElement) {
    const nodeSet = this.sourceMap.get(video)
    if (!nodeSet || !this.audioCtx) return

    const { source, gainNode, highpassFilter, peakingFilter } = nodeSet
    const ctx = this.audioCtx

    // First disconnect everything to rebuild the graph
    try {
      source.disconnect()
      highpassFilter.disconnect()
      peakingFilter.disconnect()
      gainNode.disconnect()
    } catch (e) {
      // Ignore disconnect errors if not connected
    }

    const isEnabled = this.settings?.isExtensionEnabled ?? true
    const volumeBoost = isEnabled ? (this.settings?.audioVolumeBoost ?? 100) : 100
    const vocalBoost = isEnabled ? (this.settings?.audioVocalBoost ?? false) : false

    // Set gain: volumeBoost is in percentage (e.g. 100 to 300)
    gainNode.gain.setValueAtTime(volumeBoost / 100, ctx.currentTime)

    // Reconstruct the graph based on Vocal Boost toggle
    if (vocalBoost) {
      source.connect(highpassFilter)
      highpassFilter.connect(peakingFilter)
      peakingFilter.connect(gainNode)
      gainNode.connect(ctx.destination)
    } else {
      source.connect(gainNode)
      gainNode.connect(ctx.destination)
    }
  }

  public apply(settings: Settings) {
    this.settings = settings
    
    const hasActiveBoost = settings.isExtensionEnabled && 
      ((settings.audioVolumeBoost ?? 100) > 100 || (settings.audioVocalBoost ?? false))
    
    if (hasActiveBoost) {
      this.getAudioContext()
    }

    const videos = document.querySelectorAll("video")
    videos.forEach((video) => {
      // If settings have active boost OR we have already hooked this video previously,
      // make sure it's hooked / updated
      if (hasActiveBoost || this.sourceMap.has(video)) {
        this.hookVideo(video)
        this.updateVideoNodes(video)
      }
    })

    if (hasActiveBoost) {
      this.resumeContext()
    }
  }
}
