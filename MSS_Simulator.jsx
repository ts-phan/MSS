<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta http-equiv="Content-Style-Type" content="text/css">
  <title></title>
  <meta name="Generator" content="Cocoa HTML Writer">
  <meta name="CocoaVersion" content="2575.2">
  <style type="text/css">
    p.p1 {margin: 0.0px 0.0px 0.0px 0.0px; font: 12.0px Helvetica}
    p.p2 {margin: 0.0px 0.0px 0.0px 0.0px; font: 12.0px Helvetica; min-height: 14.0px}
  </style>
</head>
<body>
<p class="p1">file="MSS_Simulator.jsx"</p>
<p class="p1">import React, { useState, useMemo } from 'react';</p>
<p class="p1">import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';</p>
<p class="p2"><br></p>
<p class="p1">// ─────────────────────────────────────────────────────────────────</p>
<p class="p1">// MOTEUR PHYSIQUE — modèle 2 DDL discret (rail sur semelle, dalle sur MSS)</p>
<p class="p1">// ─────────────────────────────────────────────────────────────────</p>
<p class="p1">function computeCurves(p) {</p>
<p class="p1"><span class="Apple-converted-space">  </span>const {</p>
<p class="p1"><span class="Apple-converted-space">    </span>E_rail, A_rail, rho_rail,</p>
<p class="p1"><span class="Apple-converted-space">    </span>k_pad, c_pad, a_RS,</p>
<p class="p1"><span class="Apple-converted-space">    </span>h_dalle, b_dalle, rho_beton,</p>
<p class="p1"><span class="Apple-converted-space">    </span>h_top, rho_top,</p>
<p class="p1"><span class="Apple-converted-space">    </span>C_MSS, zeta_MSS,</p>
<p class="p1"><span class="Apple-converted-space">    </span>Q_roue,</p>
<p class="p1"><span class="Apple-converted-space">  </span>} = p;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>// Masses tributaires [kg] (a_RS en mm, rho en kg/mm3)</p>
<p class="p1"><span class="Apple-converted-space">  </span>const m1 = rho_rail * A_rail * a_RS;</p>
<p class="p1"><span class="Apple-converted-space">  </span>const m2 = (rho_beton * h_dalle * b_dalle + rho_top * h_top * b_dalle) * a_RS;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>const k1 = k_pad; <span class="Apple-converted-space">                      </span>// N/mm</p>
<p class="p1"><span class="Apple-converted-space">  </span>const k2 = C_MSS * b_dalle * a_RS;<span class="Apple-converted-space">      </span>// N/mm</p>
<p class="p1"><span class="Apple-converted-space">  </span>const c1 = c_pad;<span class="Apple-converted-space">                        </span>// N.s/mm</p>
<p class="p1"><span class="Apple-converted-space">  </span>const c2 = 2 * zeta_MSS * Math.sqrt(k2 * m2); // N.s/mm</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>const freqs = [4, 5, 6.3, 8, 10, 12.5, 16, 20, 25, 31.5, 40, 50, 63, 80, 100, 125, 160, 200, 250];</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>const sysAmp = [];</p>
<p class="p1"><span class="Apple-converted-space">  </span>const refAmp = [];</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>for (const f of freqs) {</p>
<p class="p1"><span class="Apple-converted-space">    </span>const w = 2 * Math.PI * f;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">    </span>// Complex arithmetic (re, im)</p>
<p class="p1"><span class="Apple-converted-space">    </span>const K1re = k1 * 1000, K1im = w * c1 * 1000;</p>
<p class="p1"><span class="Apple-converted-space">    </span>const K2re = k2 * 1000, K2im = w * c2 * 1000;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">    </span>// M11 = -m1*w^2 + K1 + K2 ; M21 = -K2 ; M22 = -m2*w^2 + K2</p>
<p class="p1"><span class="Apple-converted-space">    </span>const M11re = -m1 * w * w + K1re + K2re, M11im = K1im + K2im;</p>
<p class="p1"><span class="Apple-converted-space">    </span>const M21re = -K2re, M21im = -K2im;</p>
<p class="p1"><span class="Apple-converted-space">    </span>const M22re = -m2 * w * w + K2re, M22im = K2im;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">    </span>// det = M11*M22 - M21*M21 <span class="Apple-converted-space">  </span>(complex mult)</p>
<p class="p1"><span class="Apple-converted-space">    </span>const cmul = (are, aim, bre, bim) =&gt; [are * bre - aim * bim, are * bim + aim * bre];</p>
<p class="p1"><span class="Apple-converted-space">    </span>const [t1re, t1im] = cmul(M11re, M11im, M22re, M22im);</p>
<p class="p1"><span class="Apple-converted-space">    </span>const [t2re, t2im] = cmul(M21re, M21im, M21re, M21im);</p>
<p class="p1"><span class="Apple-converted-space">    </span>const detre = t1re - t2re, detim = t1im - t2im;</p>
<p class="p1"><span class="Apple-converted-space">    </span>const detmag2 = detre * detre + detim * detim;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">    </span>// X2 = -M21*Q / det <span class="Apple-converted-space">  </span>(Q is real, applied on m1)</p>
<p class="p1"><span class="Apple-converted-space">    </span>const numre = -M21re * Q_roue, numim = -M21im * Q_roue;</p>
<p class="p1"><span class="Apple-converted-space">    </span>// divide by det: (num * conj(det)) / |det|^2</p>
<p class="p1"><span class="Apple-converted-space">    </span>const [dre, dim] = cmul(numre, numim, detre, -detim);</p>
<p class="p1"><span class="Apple-converted-space">    </span>const X2re = dre / detmag2, X2im = dim / detmag2;</p>
<p class="p1"><span class="Apple-converted-space">    </span>const X2mag = Math.sqrt(X2re * X2re + X2im * X2im);</p>
<p class="p1"><span class="Apple-converted-space">    </span>sysAmp.push(X2mag);</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">    </span>// Reference: k2 -&gt; very stiff (rigid base directly under pad), track X1 (rail on rigid base)</p>
<p class="p1"><span class="Apple-converted-space">    </span>const K2rre = 1e15, K2rim = 0;</p>
<p class="p1"><span class="Apple-converted-space">    </span>const M11rre = -m1 * w * w + K1re + K2rre, M11rim = K1im;</p>
<p class="p1"><span class="Apple-converted-space">    </span>const M21rre = -K2rre, M21rim = 0;</p>
<p class="p1"><span class="Apple-converted-space">    </span>const M22rre = -m2 * w * w + K2rre, M22rim = 0;</p>
<p class="p1"><span class="Apple-converted-space">    </span>const [t1rre, t1rim] = cmul(M11rre, M11rim, M22rre, M22rim);</p>
<p class="p1"><span class="Apple-converted-space">    </span>const [t2rre, t2rim] = cmul(M21rre, M21rim, M21rre, M21rim);</p>
<p class="p1"><span class="Apple-converted-space">    </span>const detrre = t1rre - t2rre, detrim = t1rim - t2rim;</p>
<p class="p1"><span class="Apple-converted-space">    </span>const detrmag2 = detrre * detrre + detrim * detrim;</p>
<p class="p1"><span class="Apple-converted-space">    </span>// X1r = M22r * Q / detr</p>
<p class="p1"><span class="Apple-converted-space">    </span>const num1re = M22rre * Q_roue, num1im = M22rim * Q_roue;</p>
<p class="p1"><span class="Apple-converted-space">    </span>const [d1re, d1im] = cmul(num1re, num1im, detrre, -detrim);</p>
<p class="p1"><span class="Apple-converted-space">    </span>const X1rre = d1re / detrmag2, X1rim = d1im / detrmag2;</p>
<p class="p1"><span class="Apple-converted-space">    </span>const X1rmag = Math.sqrt(X1rre * X1rre + X1rim * X1rim);</p>
<p class="p1"><span class="Apple-converted-space">    </span>refAmp.push(X1rmag);</p>
<p class="p1"><span class="Apple-converted-space">  </span>}</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>const sys0 = sysAmp[0], ref0 = refAmp[0];</p>
<p class="p1"><span class="Apple-converted-space">  </span>const data = freqs.map((f, i) =&gt; {</p>
<p class="p1"><span class="Apple-converted-space">    </span>const Tsys = 20 * Math.log10(sysAmp[i] / sys0);</p>
<p class="p1"><span class="Apple-converted-space">    </span>const Tref = 20 * Math.log10(refAmp[i] / ref0);</p>
<p class="p1"><span class="Apple-converted-space">    </span>const IL = Tref - Tsys;</p>
<p class="p1"><span class="Apple-converted-space">    </span>return { f, Tsys: round2(Tsys), Tref: round2(Tref), IL: round2(IL) };</p>
<p class="p1"><span class="Apple-converted-space">  </span>});</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>return { data, m1, m2, k1, k2, c1, c2 };</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function round2(x) { return Math.round(x * 100) / 100; }</p>
<p class="p2"><br></p>
<p class="p1">// ─────────────────────────────────────────────────────────────────</p>
<p class="p1">// PARAMETRES PAR DEFAUT</p>
<p class="p1">// ─────────────────────────────────────────────────────────────────</p>
<p class="p1">const DEFAULTS = {</p>
<p class="p1"><span class="Apple-converted-space">  </span>E_rail: 210000, A_rail: 6950, rho_rail: 7.85e-6,</p>
<p class="p1"><span class="Apple-converted-space">  </span>k_pad: 225000, c_pad: 50, a_RS: 750,</p>
<p class="p1"><span class="Apple-converted-space">  </span>h_dalle: 500, b_dalle: 650, rho_beton: 2.5e-6,</p>
<p class="p1"><span class="Apple-converted-space">  </span>h_top: 200, rho_top: 1.7e-6,</p>
<p class="p1"><span class="Apple-converted-space">  </span>C_MSS: 0.01366, zeta_MSS: 0.10,</p>
<p class="p1"><span class="Apple-converted-space">  </span>Q_roue: 55000,</p>
<p class="p1">};</p>
<p class="p2"><br></p>
<p class="p1">const PRESETS = {</p>
<p class="p1"><span class="Apple-converted-space">  </span>'LMFS Paris T1 (RP150 / SR2255)': { ...DEFAULTS },</p>
<p class="p1"><span class="Apple-converted-space">  </span>'Semelle plus raide (RP300)': { ...DEFAULTS, k_pad: 300000, c_pad: 65 },</p>
<p class="p1"><span class="Apple-converted-space">  </span>'MSS plus mou (SR1258 equivalent)': { ...DEFAULTS, C_MSS: 0.006, zeta_MSS: 0.12 },</p>
<p class="p1"><span class="Apple-converted-space">  </span>'Dalle plus lourde (h=700mm)': { ...DEFAULTS, h_dalle: 700 },</p>
<p class="p1">};</p>
<p class="p2"><br></p>
<p class="p1">// ─────────────────────────────────────────────────────────────────</p>
<p class="p1">// COMPOSANTS UI</p>
<p class="p1">// ─────────────────────────────────────────────────────────────────</p>
<p class="p1">function Slider({ label, unit, value, min, max, step, onChange, hint, formatValue }) {</p>
<p class="p1"><span class="Apple-converted-space">  </span>const displayVal = formatValue ? formatValue(value) : value;</p>
<p class="p1"><span class="Apple-converted-space">  </span>return (</p>
<p class="p1"><span class="Apple-converted-space">    </span>&lt;div style={{ marginBottom: 14 }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">      </span>&lt;div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 3 }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">        </span>&lt;label style={{ fontSize: 12.5, color: '#3a3f4b', fontWeight: 600, letterSpacing: 0.1 }}&gt;{label}&lt;/label&gt;</p>
<p class="p1"><span class="Apple-converted-space">        </span>&lt;span style={{ fontSize: 12.5, color: '#0d5c63', fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">          </span>{displayVal} &lt;span style={{ color: '#8a93a3', fontWeight: 500 }}&gt;{unit}&lt;/span&gt;</p>
<p class="p1"><span class="Apple-converted-space">        </span>&lt;/span&gt;</p>
<p class="p1"><span class="Apple-converted-space">      </span>&lt;/div&gt;</p>
<p class="p1"><span class="Apple-converted-space">      </span>&lt;input</p>
<p class="p1"><span class="Apple-converted-space">        </span>type="range"</p>
<p class="p1"><span class="Apple-converted-space">        </span>min={min} max={max} step={step} value={value}</p>
<p class="p1"><span class="Apple-converted-space">        </span>onChange={(e) =&gt; onChange(parseFloat(e.target.value))}</p>
<p class="p1"><span class="Apple-converted-space">        </span>style={{</p>
<p class="p1"><span class="Apple-converted-space">          </span>width: '100%', height: 4, borderRadius: 2, appearance: 'none',</p>
<p class="p1"><span class="Apple-converted-space">          </span>background: `linear-gradient(to right, #0d5c63 0%, #0d5c63 ${((value - min) / (max - min)) * 100}%, #dde3ea ${((value - min) / (max - min)) * 100}%, #dde3ea 100%)`,</p>
<p class="p1"><span class="Apple-converted-space">          </span>outline: 'none', cursor: 'pointer',</p>
<p class="p1"><span class="Apple-converted-space">        </span>}}</p>
<p class="p1"><span class="Apple-converted-space">      </span>/&gt;</p>
<p class="p1"><span class="Apple-converted-space">      </span>{hint &amp;&amp; &lt;div style={{ fontSize: 10.5, color: '#9aa3b2', marginTop: 2 }}&gt;{hint}&lt;/div&gt;}</p>
<p class="p1"><span class="Apple-converted-space">    </span>&lt;/div&gt;</p>
<p class="p1"><span class="Apple-converted-space">  </span>);</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function SectionLabel({ children, num }) {</p>
<p class="p1"><span class="Apple-converted-space">  </span>return (</p>
<p class="p1"><span class="Apple-converted-space">    </span>&lt;div style={{</p>
<p class="p1"><span class="Apple-converted-space">      </span>display: 'flex', alignItems: 'center', gap: 8, margin: '22px 0 12px 0',</p>
<p class="p1"><span class="Apple-converted-space">    </span>}}&gt;</p>
<p class="p1"><span class="Apple-converted-space">      </span>&lt;span style={{</p>
<p class="p1"><span class="Apple-converted-space">        </span>fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#c96a3a',</p>
<p class="p1"><span class="Apple-converted-space">        </span>border: '1px solid #c96a3a', borderRadius: 3, padding: '1px 5px', fontWeight: 600,</p>
<p class="p1"><span class="Apple-converted-space">      </span>}}&gt;{num}&lt;/span&gt;</p>
<p class="p1"><span class="Apple-converted-space">      </span>&lt;span style={{ fontSize: 11.5, fontWeight: 700, color: '#1c2430', letterSpacing: 0.4, textTransform: 'uppercase' }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">        </span>{children}</p>
<p class="p1"><span class="Apple-converted-space">      </span>&lt;/span&gt;</p>
<p class="p1"><span class="Apple-converted-space">      </span>&lt;div style={{ flex: 1, height: 1, background: '#e4e8ee' }} /&gt;</p>
<p class="p1"><span class="Apple-converted-space">    </span>&lt;/div&gt;</p>
<p class="p1"><span class="Apple-converted-space">  </span>);</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function StatCard({ label, value, unit, accent }) {</p>
<p class="p1"><span class="Apple-converted-space">  </span>return (</p>
<p class="p1"><span class="Apple-converted-space">    </span>&lt;div style={{</p>
<p class="p1"><span class="Apple-converted-space">      </span>background: '#fff', border: '1px solid #e4e8ee', borderRadius: 8, padding: '10px 12px',</p>
<p class="p1"><span class="Apple-converted-space">      </span>flex: 1, minWidth: 0,</p>
<p class="p1"><span class="Apple-converted-space">    </span>}}&gt;</p>
<p class="p1"><span class="Apple-converted-space">      </span>&lt;div style={{ fontSize: 9.5, color: '#8a93a3', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 3 }}&gt;{label}&lt;/div&gt;</p>
<p class="p1"><span class="Apple-converted-space">      </span>&lt;div style={{ fontSize: 17, fontWeight: 700, color: accent || '#1c2430', fontVariantNumeric: 'tabular-nums' }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">        </span>{value} &lt;span style={{ fontSize: 11, fontWeight: 500, color: '#9aa3b2' }}&gt;{unit}&lt;/span&gt;</p>
<p class="p1"><span class="Apple-converted-space">      </span>&lt;/div&gt;</p>
<p class="p1"><span class="Apple-converted-space">    </span>&lt;/div&gt;</p>
<p class="p1"><span class="Apple-converted-space">  </span>);</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">function CustomTooltip({ active, payload, label }) {</p>
<p class="p1"><span class="Apple-converted-space">  </span>if (!active || !payload || !payload.length) return null;</p>
<p class="p1"><span class="Apple-converted-space">  </span>return (</p>
<p class="p1"><span class="Apple-converted-space">    </span>&lt;div style={{</p>
<p class="p1"><span class="Apple-converted-space">      </span>background: '#1c2430', color: '#fff', borderRadius: 6, padding: '8px 11px',</p>
<p class="p1"><span class="Apple-converted-space">      </span>fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", boxShadow: '0 4px 14px rgba(0,0,0,0.25)',</p>
<p class="p1"><span class="Apple-converted-space">    </span>}}&gt;</p>
<p class="p1"><span class="Apple-converted-space">      </span>&lt;div style={{ opacity: 0.6, marginBottom: 3 }}&gt;f = {label} Hz&lt;/div&gt;</p>
<p class="p1"><span class="Apple-converted-space">      </span>{payload.map((p, i) =&gt; (</p>
<p class="p1"><span class="Apple-converted-space">        </span>&lt;div key={i} style={{ color: p.color }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">          </span>{p.name}: {p.value.toFixed(2)} dB</p>
<p class="p1"><span class="Apple-converted-space">        </span>&lt;/div&gt;</p>
<p class="p1"><span class="Apple-converted-space">      </span>))}</p>
<p class="p1"><span class="Apple-converted-space">    </span>&lt;/div&gt;</p>
<p class="p1"><span class="Apple-converted-space">  </span>);</p>
<p class="p1">}</p>
<p class="p2"><br></p>
<p class="p1">// ─────────────────────────────────────────────────────────────────</p>
<p class="p1">// APP PRINCIPALE</p>
<p class="p1">// ─────────────────────────────────────────────────────────────────</p>
<p class="p1">export default function App() {</p>
<p class="p1"><span class="Apple-converted-space">  </span>const [params, setParams] = useState(DEFAULTS);</p>
<p class="p1"><span class="Apple-converted-space">  </span>const [presetName, setPresetName] = useState('LMFS Paris T1 (RP150 / SR2255)');</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>const update = (key) =&gt; (val) =&gt; {</p>
<p class="p1"><span class="Apple-converted-space">    </span>setParams((prev) =&gt; ({ ...prev, [key]: val }));</p>
<p class="p1"><span class="Apple-converted-space">    </span>setPresetName('Personnalise');</p>
<p class="p1"><span class="Apple-converted-space">  </span>};</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>const applyPreset = (name) =&gt; {</p>
<p class="p1"><span class="Apple-converted-space">    </span>setPresetName(name);</p>
<p class="p1"><span class="Apple-converted-space">    </span>setParams(PRESETS[name]);</p>
<p class="p1"><span class="Apple-converted-space">  </span>};</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>const result = useMemo(() =&gt; computeCurves(params), [params]);</p>
<p class="p1"><span class="Apple-converted-space">  </span>const { data, m1, m2, k1, k2 } = result;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>const f0_approx = useMemo(() =&gt; {</p>
<p class="p1"><span class="Apple-converted-space">    </span>// approximate dominant peak of Tsys curve</p>
<p class="p1"><span class="Apple-converted-space">    </span>let maxT = -Infinity, maxF = 0;</p>
<p class="p1"><span class="Apple-converted-space">    </span>data.forEach(d =&gt; { if (d.Tsys &gt; maxT) { maxT = d.Tsys; maxF = d.f; } });</p>
<p class="p1"><span class="Apple-converted-space">    </span>return maxF;</p>
<p class="p1"><span class="Apple-converted-space">  </span>}, [data]);</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>const ilAt63 = data.find(d =&gt; d.f === 63)?.IL ?? 0;</p>
<p class="p1"><span class="Apple-converted-space">  </span>const ilMin = Math.min(...data.map(d =&gt; d.IL));</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">  </span>return (</p>
<p class="p1"><span class="Apple-converted-space">    </span>&lt;div style={{</p>
<p class="p1"><span class="Apple-converted-space">      </span>fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",</p>
<p class="p1"><span class="Apple-converted-space">      </span>background: '#f3f5f8', minHeight: '100vh', color: '#1c2430',</p>
<p class="p1"><span class="Apple-converted-space">    </span>}}&gt;</p>
<p class="p1"><span class="Apple-converted-space">      </span>&lt;style&gt;{`</p>
<p class="p1"><span class="Apple-converted-space">        </span>@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&amp;family=IBM+Plex+Mono:wght@400;500;600&amp;display=swap');</p>
<p class="p1"><span class="Apple-converted-space">        </span>input[type=range]::-webkit-slider-thumb {</p>
<p class="p1"><span class="Apple-converted-space">          </span>appearance: none; width: 14px; height: 14px; border-radius: 50%;</p>
<p class="p1"><span class="Apple-converted-space">          </span>background: #0d5c63; cursor: pointer; border: 2px solid #fff;</p>
<p class="p1"><span class="Apple-converted-space">          </span>box-shadow: 0 1px 4px rgba(0,0,0,0.3);</p>
<p class="p1"><span class="Apple-converted-space">        </span>}</p>
<p class="p1"><span class="Apple-converted-space">        </span>input[type=range]::-moz-range-thumb {</p>
<p class="p1"><span class="Apple-converted-space">          </span>width: 14px; height: 14px; border-radius: 50%;</p>
<p class="p1"><span class="Apple-converted-space">          </span>background: #0d5c63; cursor: pointer; border: 2px solid #fff;</p>
<p class="p1"><span class="Apple-converted-space">          </span>box-shadow: 0 1px 4px rgba(0,0,0,0.3);</p>
<p class="p1"><span class="Apple-converted-space">        </span>}</p>
<p class="p1"><span class="Apple-converted-space">        </span>* { box-sizing: border-box; }</p>
<p class="p1"><span class="Apple-converted-space">      </span>`}&lt;/style&gt;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">      </span>{/* HEADER */}</p>
<p class="p1"><span class="Apple-converted-space">      </span>&lt;div style={{</p>
<p class="p1"><span class="Apple-converted-space">        </span>background: '#12181f', color: '#fff', padding: '20px 28px',</p>
<p class="p1"><span class="Apple-converted-space">        </span>borderBottom: '3px solid #c96a3a',</p>
<p class="p1"><span class="Apple-converted-space">      </span>}}&gt;</p>
<p class="p1"><span class="Apple-converted-space">        </span>&lt;div style={{ maxWidth: 1320, margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10 }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;div&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;div style={{ fontSize: 10.5, color: '#c96a3a', fontFamily: "'IBM Plex Mono', monospace", letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 4 }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">              </span>Simulation interactive — Voie sur dalle flottante</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;/div&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, letterSpacing: -0.3 }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">              </span>Perte par insertion — Système masse-ressort</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;/h1&gt;</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;/div&gt;</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;div style={{ fontSize: 11, color: '#8a93a3', fontFamily: "'IBM Plex Mono', monospace", textAlign: 'right' }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>Modele 2 DDL discret (rail/semelle + dalle/MSS)&lt;br/&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>Reference : radier infiniment rigide</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;/div&gt;</p>
<p class="p1"><span class="Apple-converted-space">        </span>&lt;/div&gt;</p>
<p class="p1"><span class="Apple-converted-space">      </span>&lt;/div&gt;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">      </span>&lt;div style={{ maxWidth: 1320, margin: '0 auto', padding: '24px 28px 60px', display: 'grid', gridTemplateColumns: '340px 1fr', gap: 24 }}&gt;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">        </span>{/* ═══════════ PANNEAU DE PARAMETRES ═══════════ */}</p>
<p class="p1"><span class="Apple-converted-space">        </span>&lt;div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e8ee', padding: '18px 20px', height: 'fit-content', position: 'sticky', top: 20 }}&gt;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;div style={{ marginBottom: 16 }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;label style={{ fontSize: 11, fontWeight: 700, color: '#8a93a3', textTransform: 'uppercase', letterSpacing: 0.5 }}&gt;Configuration&lt;/label&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;select</p>
<p class="p1"><span class="Apple-converted-space">              </span>value={presetName}</p>
<p class="p1"><span class="Apple-converted-space">              </span>onChange={(e) =&gt; applyPreset(e.target.value)}</p>
<p class="p1"><span class="Apple-converted-space">              </span>style={{</p>
<p class="p1"><span class="Apple-converted-space">                </span>width: '100%', marginTop: 6, padding: '8px 10px', borderRadius: 7,</p>
<p class="p1"><span class="Apple-converted-space">                </span>border: '1px solid #dde3ea', fontSize: 12.5, fontWeight: 600, color: '#1c2430',</p>
<p class="p1"><span class="Apple-converted-space">                </span>background: '#f9fafb', cursor: 'pointer',</p>
<p class="p1"><span class="Apple-converted-space">              </span>}}</p>
<p class="p1"><span class="Apple-converted-space">            </span>&gt;</p>
<p class="p1"><span class="Apple-converted-space">              </span>{Object.keys(PRESETS).map(name =&gt; &lt;option key={name} value={name}&gt;{name}&lt;/option&gt;)}</p>
<p class="p1"><span class="Apple-converted-space">              </span>{presetName === 'Personnalise' &amp;&amp; &lt;option value="Personnalise"&gt;Personnalise&lt;/option&gt;}</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;/select&gt;</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;/div&gt;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;SectionLabel num="01"&gt;Vehicule / Charge&lt;/SectionLabel&gt;</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;Slider label="Charge par essieu" unit="kN" value={params.Q_roue * 2 / 1000}</p>
<p class="p1"><span class="Apple-converted-space">            </span>min={40} max={250} step={5}</p>
<p class="p1"><span class="Apple-converted-space">            </span>onChange={(v) =&gt; update('Q_roue')(v * 1000 / 2)}</p>
<p class="p1"><span class="Apple-converted-space">            </span>formatValue={(v) =&gt; v.toFixed(0)} /&gt;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;SectionLabel num="02"&gt;Rail (54G2)&lt;/SectionLabel&gt;</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;Slider label="Module de Young" unit="MPa" value={params.E_rail}</p>
<p class="p1"><span class="Apple-converted-space">            </span>min={180000} max={220000} step={1000}</p>
<p class="p1"><span class="Apple-converted-space">            </span>onChange={update('E_rail')} formatValue={(v) =&gt; (v/1000).toFixed(0)+'k'} /&gt;</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;Slider label="Section du rail" unit="mm²" value={params.A_rail}</p>
<p class="p1"><span class="Apple-converted-space">            </span>min={5000} max={9000} step={50}</p>
<p class="p1"><span class="Apple-converted-space">            </span>onChange={update('A_rail')} /&gt;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;SectionLabel num="03"&gt;Semelle sous selle&lt;/SectionLabel&gt;</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;Slider label="Raideur dynamique" unit="kN/mm" value={params.k_pad / 1000}</p>
<p class="p1"><span class="Apple-converted-space">            </span>min={50} max={500} step={5}</p>
<p class="p1"><span class="Apple-converted-space">            </span>onChange={(v) =&gt; update('k_pad')(v * 1000)}</p>
<p class="p1"><span class="Apple-converted-space">            </span>hint="RP150→150 kN/mm statique, ~225 kN/mm dynamique" /&gt;</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;Slider label="Amortissement pad" unit="N·s/mm" value={params.c_pad}</p>
<p class="p1"><span class="Apple-converted-space">            </span>min={5} max={200} step={5}</p>
<p class="p1"><span class="Apple-converted-space">            </span>onChange={update('c_pad')} /&gt;</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;Slider label="Entraxe fixations" unit="mm" value={params.a_RS}</p>
<p class="p1"><span class="Apple-converted-space">            </span>min={500} max={1000} step={10}</p>
<p class="p1"><span class="Apple-converted-space">            </span>onChange={update('a_RS')} /&gt;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;SectionLabel num="04"&gt;Dalle flottante&lt;/SectionLabel&gt;</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;Slider label="Hauteur dalle" unit="mm" value={params.h_dalle}</p>
<p class="p1"><span class="Apple-converted-space">            </span>min={300} max={800} step={10}</p>
<p class="p1"><span class="Apple-converted-space">            </span>onChange={update('h_dalle')} /&gt;</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;Slider label="Largeur dalle" unit="mm" value={params.b_dalle}</p>
<p class="p1"><span class="Apple-converted-space">            </span>min={400} max={1600} step={10}</p>
<p class="p1"><span class="Apple-converted-space">            </span>onChange={update('b_dalle')} /&gt;</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;Slider label="Hauteur couche sup." unit="mm" value={params.h_top}</p>
<p class="p1"><span class="Apple-converted-space">            </span>min={0} max={400} step={10}</p>
<p class="p1"><span class="Apple-converted-space">            </span>onChange={update('h_top')} /&gt;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;SectionLabel num="05"&gt;MSS élastomère&lt;/SectionLabel&gt;</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;Slider label="Module de lit dynamique" unit="N/mm³" value={params.C_MSS}</p>
<p class="p1"><span class="Apple-converted-space">            </span>min={0.003} max={0.03} step={0.0005}</p>
<p class="p1"><span class="Apple-converted-space">            </span>onChange={update('C_MSS')}</p>
<p class="p1"><span class="Apple-converted-space">            </span>formatValue={(v) =&gt; v.toFixed(4)}</p>
<p class="p1"><span class="Apple-converted-space">            </span>hint="SR2255 ≈ 0.0137, SR1258 (plus mou) ≈ 0.006" /&gt;</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;Slider label="Amortissement structural ζ" unit="—" value={params.zeta_MSS}</p>
<p class="p1"><span class="Apple-converted-space">            </span>min={0.02} max={0.30} step={0.01}</p>
<p class="p1"><span class="Apple-converted-space">            </span>onChange={update('zeta_MSS')} formatValue={(v) =&gt; v.toFixed(2)} /&gt;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;button</p>
<p class="p1"><span class="Apple-converted-space">            </span>onClick={() =&gt; { setParams(DEFAULTS); setPresetName('LMFS Paris T1 (RP150 / SR2255)'); }}</p>
<p class="p1"><span class="Apple-converted-space">            </span>style={{</p>
<p class="p1"><span class="Apple-converted-space">              </span>width: '100%', marginTop: 18, padding: '9px 0', borderRadius: 7, border: '1px solid #dde3ea',</p>
<p class="p1"><span class="Apple-converted-space">              </span>background: '#f9fafb', color: '#5a6272', fontSize: 12, fontWeight: 600, cursor: 'pointer',</p>
<p class="p1"><span class="Apple-converted-space">            </span>}}</p>
<p class="p1"><span class="Apple-converted-space">          </span>&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>↺ Réinitialiser les paramètres</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;/button&gt;</p>
<p class="p1"><span class="Apple-converted-space">        </span>&lt;/div&gt;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">        </span>{/* ═══════════ ZONE DE RESULTATS ═══════════ */}</p>
<p class="p1"><span class="Apple-converted-space">        </span>&lt;div&gt;</p>
<p class="p1"><span class="Apple-converted-space">          </span>{/* STAT CARDS */}</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;div style={{ display: 'flex', gap: 10, marginBottom: 18 }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;StatCard label="Masse rail (tributaire)" value={m1.toFixed(1)} unit="kg" /&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;StatCard label="Masse dalle (tributaire)" value={m2.toFixed(0)} unit="kg" /&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;StatCard label="Raideur semelle" value={(k1/1000).toFixed(0)} unit="kN/mm" /&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;StatCard label="Raideur MSS (ponctuelle)" value={k2.toFixed(0)} unit="N/mm" /&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;StatCard label="Résonance dominante" value={f0_approx} unit="Hz" accent="#c96a3a" /&gt;</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;/div&gt;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">          </span>{/* CHART 1 - FONCTION DE TRANSFERT */}</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e8ee', padding: '18px 20px 10px', marginBottom: 18 }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">              </span>&lt;h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}&gt;Fonction de transfert&lt;/h3&gt;</p>
<p class="p1"><span class="Apple-converted-space">              </span>&lt;span style={{ fontSize: 11, color: '#9aa3b2', fontFamily: "'IBM Plex Mono', monospace" }}&gt;T(f) [dB] — normalisée à f→0&lt;/span&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;/div&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;ResponsiveContainer width="100%" height={280}&gt;</p>
<p class="p1"><span class="Apple-converted-space">              </span>&lt;LineChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">                </span>&lt;CartesianGrid strokeDasharray="2 4" stroke="#eef1f5" /&gt;</p>
<p class="p1"><span class="Apple-converted-space">                </span>&lt;XAxis dataKey="f" scale="log" domain={['auto', 'auto']} type="number"</p>
<p class="p1"><span class="Apple-converted-space">                  </span>ticks={[4,10,20,40,63,100,160,250]}</p>
<p class="p1"><span class="Apple-converted-space">                  </span>tick={{ fontSize: 11, fill: '#8a93a3' }} label={{ value: 'Frequence [Hz]', position: 'insideBottom', offset: -3, fontSize: 11, fill: '#8a93a3' }} /&gt;</p>
<p class="p1"><span class="Apple-converted-space">                </span>&lt;YAxis tick={{ fontSize: 11, fill: '#8a93a3' }} label={{ value: 'dB', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#8a93a3' }} /&gt;</p>
<p class="p1"><span class="Apple-converted-space">                </span>&lt;Tooltip content={&lt;CustomTooltip /&gt;} /&gt;</p>
<p class="p1"><span class="Apple-converted-space">                </span>&lt;Legend wrapperStyle={{ fontSize: 12 }} /&gt;</p>
<p class="p1"><span class="Apple-converted-space">                </span>&lt;ReferenceLine y={0} stroke="#c4cad4" strokeDasharray="3 3" /&gt;</p>
<p class="p1"><span class="Apple-converted-space">                </span>&lt;Line type="monotone" dataKey="Tsys" name="Systeme MSS + semelle" stroke="#c96a3a" strokeWidth={2.5} dot={{ r: 2.5 }} /&gt;</p>
<p class="p1"><span class="Apple-converted-space">                </span>&lt;Line type="monotone" dataKey="Tref" name="Semelle seule (ref. rigide)" stroke="#9aa3b2" strokeWidth={2} dot={{ r: 2.5 }} strokeDasharray="4 3" /&gt;</p>
<p class="p1"><span class="Apple-converted-space">              </span>&lt;/LineChart&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;/ResponsiveContainer&gt;</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;/div&gt;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">          </span>{/* CHART 2 - PERTE PAR INSERTION */}</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e8ee', padding: '18px 20px 10px', marginBottom: 18 }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">              </span>&lt;h3 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}&gt;Perte par insertion&lt;/h3&gt;</p>
<p class="p1"><span class="Apple-converted-space">              </span>&lt;span style={{ fontSize: 11, color: '#9aa3b2', fontFamily: "'IBM Plex Mono', monospace" }}&gt;IL(f) = T_ref(f) − T_sys(f)&lt;/span&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;/div&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;ResponsiveContainer width="100%" height={280}&gt;</p>
<p class="p1"><span class="Apple-converted-space">              </span>&lt;LineChart data={data} margin={{ top: 10, right: 20, bottom: 5, left: 0 }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">                </span>&lt;CartesianGrid strokeDasharray="2 4" stroke="#eef1f5" /&gt;</p>
<p class="p1"><span class="Apple-converted-space">                </span>&lt;XAxis dataKey="f" scale="log" domain={['auto', 'auto']} type="number"</p>
<p class="p1"><span class="Apple-converted-space">                  </span>ticks={[4,10,20,40,63,100,160,250]}</p>
<p class="p1"><span class="Apple-converted-space">                  </span>tick={{ fontSize: 11, fill: '#8a93a3' }} label={{ value: 'Frequence [Hz]', position: 'insideBottom', offset: -3, fontSize: 11, fill: '#8a93a3' }} /&gt;</p>
<p class="p1"><span class="Apple-converted-space">                </span>&lt;YAxis tick={{ fontSize: 11, fill: '#8a93a3' }} label={{ value: 'dB', angle: -90, position: 'insideLeft', fontSize: 11, fill: '#8a93a3' }} /&gt;</p>
<p class="p1"><span class="Apple-converted-space">                </span>&lt;Tooltip content={&lt;CustomTooltip /&gt;} /&gt;</p>
<p class="p1"><span class="Apple-converted-space">                </span>&lt;ReferenceLine y={0} stroke="#c4cad4" strokeDasharray="3 3" /&gt;</p>
<p class="p1"><span class="Apple-converted-space">                </span>&lt;Line type="monotone" dataKey="IL" name="Perte par insertion" stroke="#0d5c63" strokeWidth={2.5} dot={{ r: 2.5 }} /&gt;</p>
<p class="p1"><span class="Apple-converted-space">              </span>&lt;/LineChart&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;/ResponsiveContainer&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;div style={{ display: 'flex', gap: 18, padding: '4px 4px 14px', fontSize: 11.5, color: '#5a6272' }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">              </span>&lt;span&gt;IL min : &lt;strong style={{ color: ilMin &lt; 0 ? '#c0392b' : '#1c2430' }}&gt;{ilMin.toFixed(1)} dB&lt;/strong&gt; (zone d'amplification)&lt;/span&gt;</p>
<p class="p1"><span class="Apple-converted-space">              </span>&lt;span&gt;IL à 63 Hz : &lt;strong&gt;{ilAt63.toFixed(1)} dB&lt;/strong&gt;&lt;/span&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;/div&gt;</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;/div&gt;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">          </span>{/* TABLE */}</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e4e8ee', padding: '16px 20px', overflowX: 'auto' }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;h3 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700 }}&gt;Valeurs numériques&lt;/h3&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5, fontFamily: "'IBM Plex Mono', monospace" }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">              </span>&lt;thead&gt;</p>
<p class="p1"><span class="Apple-converted-space">                </span>&lt;tr style={{ borderBottom: '1.5px solid #e4e8ee' }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">                  </span>{['f (Hz)', 'T_sys (dB)', 'T_ref (dB)', 'IL (dB)'].map(h =&gt; (</p>
<p class="p1"><span class="Apple-converted-space">                    </span>&lt;th key={h} style={{ textAlign: 'right', padding: '5px 10px', color: '#8a93a3', fontWeight: 600 }}&gt;{h}&lt;/th&gt;</p>
<p class="p1"><span class="Apple-converted-space">                  </span>))}</p>
<p class="p1"><span class="Apple-converted-space">                </span>&lt;/tr&gt;</p>
<p class="p1"><span class="Apple-converted-space">              </span>&lt;/thead&gt;</p>
<p class="p1"><span class="Apple-converted-space">              </span>&lt;tbody&gt;</p>
<p class="p1"><span class="Apple-converted-space">                </span>{data.map((d, i) =&gt; (</p>
<p class="p1"><span class="Apple-converted-space">                  </span>&lt;tr key={i} style={{ borderBottom: '1px solid #f2f4f7', background: d.f === 63 ? '#fdf6f1' : 'transparent' }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">                    </span>&lt;td style={{ textAlign: 'right', padding: '4px 10px', fontWeight: 600 }}&gt;{d.f}&lt;/td&gt;</p>
<p class="p1"><span class="Apple-converted-space">                    </span>&lt;td style={{ textAlign: 'right', padding: '4px 10px', color: '#c96a3a' }}&gt;{d.Tsys.toFixed(2)}&lt;/td&gt;</p>
<p class="p1"><span class="Apple-converted-space">                    </span>&lt;td style={{ textAlign: 'right', padding: '4px 10px', color: '#9aa3b2' }}&gt;{d.Tref.toFixed(2)}&lt;/td&gt;</p>
<p class="p1"><span class="Apple-converted-space">                    </span>&lt;td style={{ textAlign: 'right', padding: '4px 10px', color: d.IL &lt; 0 ? '#c0392b' : '#0d5c63', fontWeight: 600 }}&gt;{d.IL.toFixed(2)}&lt;/td&gt;</p>
<p class="p1"><span class="Apple-converted-space">                  </span>&lt;/tr&gt;</p>
<p class="p1"><span class="Apple-converted-space">                </span>))}</p>
<p class="p1"><span class="Apple-converted-space">              </span>&lt;/tbody&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>&lt;/table&gt;</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;/div&gt;</p>
<p class="p2"><br></p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;div style={{ marginTop: 16, fontSize: 11, color: '#9aa3b2', lineHeight: 1.6, padding: '0 4px' }}&gt;</p>
<p class="p1"><span class="Apple-converted-space">            </span>Modèle physique à 2 degrés de liberté discrets (masses tributaires réparties sur l'entraxe des fixations).</p>
<p class="p1"><span class="Apple-converted-space">            </span>La fréquence de résonance dominante se déplace dynamiquement selon les paramètres saisis — elle n'est</p>
<p class="p1"><span class="Apple-converted-space">            </span>pas figée à une valeur catalogue. Système de référence : semelle seule posée sur un radier supposé</p>
<p class="p1"><span class="Apple-converted-space">            </span>infiniment rigide (MSS remplacé par une raideur quasi-infinie).</p>
<p class="p1"><span class="Apple-converted-space">          </span>&lt;/div&gt;</p>
<p class="p1"><span class="Apple-converted-space">        </span>&lt;/div&gt;</p>
<p class="p1"><span class="Apple-converted-space">      </span>&lt;/div&gt;</p>
<p class="p1"><span class="Apple-converted-space">    </span>&lt;/div&gt;</p>
<p class="p1"><span class="Apple-converted-space">  </span>);</p>
<p class="p1">}</p>
</body>
</html>
