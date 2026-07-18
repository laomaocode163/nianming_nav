/**
 * 网站图标服务（公共 API 门面）
 *
 * 缓存与地址解析见 ./faviconCache；请求调度、竞速与空闲预取见 ./faviconScheduler。
 * 本文件仅做再导出，保持对外的命名导出集合不变，调用方无需改动。
 */
export * from './faviconCache';
export * from './faviconScheduler';
