'use client';

import { useEffect } from 'react';
import { getCurrentUTMParams, trackUTMToGA4, addUTMToExternalLinks } from '@/lib/utm-utils';

/**
 * UTM参数跟踪组件
 * 自动检测和跟踪页面的UTM参数
 */
export default function UTMTracker() {
  useEffect(() => {
    // 检测当前页面的UTM参数
    const utmParams = getCurrentUTMParams();
    
    // 如果有UTM参数，发送到GA4
    if (Object.keys(utmParams).length > 0) {
      console.log('🎯 检测到UTM参数:', utmParams);
      trackUTMToGA4(utmParams);
      
      // 存储到sessionStorage供后续页面使用
      sessionStorage.setItem('utm_params', JSON.stringify(utmParams));
    } else {
      // 尝试从sessionStorage获取之前的UTM参数
      const storedUTM = sessionStorage.getItem('utm_params');
      if (storedUTM) {
        try {
          const parsedUTM = JSON.parse(storedUTM);
          console.log('📦 使用存储的UTM参数:', parsedUTM);
          trackUTMToGA4(parsedUTM);
        } catch (error) {
          console.warn('解析存储的UTM参数失败:', error);
        }
      }
    }
    
    // 为外部链接自动添加UTM参数
    addUTMToExternalLinks({
      utm_source: 'buttonup',
      utm_medium: 'referral',
      utm_campaign: 'outbound_link'
    });
    
    // 监听页面变化（SPA导航）
    const handleRouteChange = () => {
      const newUTMParams = getCurrentUTMParams();
      if (Object.keys(newUTMParams).length > 0) {
        trackUTMToGA4(newUTMParams);
        sessionStorage.setItem('utm_params', JSON.stringify(newUTMParams));
      }
    };
    
    // 监听popstate事件（浏览器前进后退）
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, []);
  
  return null; // 这是一个无UI的跟踪组件
}
