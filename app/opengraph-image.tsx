import { ImageResponse } from "next/og";
export const alt="Kora, grounded AI for company knowledge";
export const size={width:1200,height:630};
export const contentType="image/png";
export default function Image(){return new ImageResponse(<div style={{width:"100%",height:"100%",display:"flex",flexDirection:"column",justifyContent:"center",padding:"72px",background:"#050505",color:"white",fontFamily:"sans-serif",border:"1px solid #242934"}}><div style={{display:"flex",alignItems:"center",gap:"18px",fontSize:34,fontWeight:700}}><div style={{display:"flex",width:56,height:56,alignItems:"center",justifyContent:"center",border:"1px solid #334155",borderRadius:8,color:"#93c5fd"}}>K</div>Kora</div><div style={{display:"flex",flexDirection:"column",marginTop:70,maxWidth:1000,fontSize:76,lineHeight:1.06,fontWeight:700}}><span>Company knowledge,</span><span style={{color:"#94a3b8"}}>grounded in its source.</span></div><div style={{marginTop:36,fontSize:26,color:"#94a3b8"}}>Approved Notion knowledge. Clear answers. Exact citations.</div></div>,size)}

