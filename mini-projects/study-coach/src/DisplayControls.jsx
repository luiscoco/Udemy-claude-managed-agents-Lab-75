import React,{useEffect,useState} from 'react';
import './display-controls.css';

const sizes=[100,110,125,150];
function savedSize(){try{const value=Number(localStorage.getItem('milestone-text-size')??localStorage.getItem('study-coach-text-size'));return sizes.includes(value)?value:125;}catch{return 125;}}
function savedTheme(){try{return localStorage.getItem('milestone-appearance')==='dark'?'dark':'light';}catch{return 'light';}}

export function DisplayControls(){
 const [size,setSize]=useState(savedSize),[theme,setTheme]=useState(savedTheme);
 useEffect(()=>{document.documentElement.style.zoom=String(size/100);try{localStorage.setItem('milestone-text-size',String(size));}catch{}},[size]);
 useEffect(()=>{document.documentElement.dataset.theme=theme;document.documentElement.style.colorScheme=theme;try{localStorage.setItem('milestone-appearance',theme);}catch{}},[theme]);
 return <div className="display-controls" aria-label="Display preferences"><label>Text size <select aria-label="Text size" value={size} onChange={event=>setSize(Number(event.target.value))}>{sizes.map(value=><option key={value} value={value}>{value}%</option>)}</select></label><label>Appearance <select aria-label="Appearance" value={theme} onChange={event=>setTheme(event.target.value)}><option value="dark">Dark</option><option value="light">Light</option></select></label></div>;
}
