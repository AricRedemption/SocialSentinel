/**
 * 导出 Dashboard 为 PDF（使用 html2canvas + jsPDF）
 * 这种方式可以确保所有AI渲染的内容和样式都被正确捕获
 */

// 定义加载函数的类型
type ImportFunction = () => Promise<any>;

// 预加载导出库的函数
const loadExportLibraries = async () => {
  // 直接使用静态字符串导入，避免 Next.js 模块解析问题
  const loadWithRetry = async (importFn: ImportFunction, retries = 3): Promise<any> => {
    for (let i = 0; i < retries; i++) {
      try {
        const mod = await importFn();
        return mod.default || mod;
      } catch (error) {
        console.warn(`导入失败，重试 ${i + 1}/${retries}:`, error);
        if (i === retries - 1) {
          throw error;
        }
        // 等待后重试
        await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
      }
    }
  };

  // 使用函数包装导入，确保模块路径正确解析
  // 优先使用 html2canvas-pro（支持现代颜色函数）
  const html2canvasModule = await loadWithRetry(async () => {
    try {
      // 优先尝试 html2canvas-pro
      return await import('html2canvas-pro');
    } catch {
      // 如果失败，回退到 html2canvas
      return await import('html2canvas');
    }
  });
  const jspdfModule = await loadWithRetry(() => import('jspdf'));

  // 处理不同的导出方式
  const html2canvas = html2canvasModule.default || html2canvasModule;
  // jspdf 可能有不同的导出结构
  const jsPDF = jspdfModule.default ||
    (jspdfModule.jsPDF ? jspdfModule.jsPDF : jspdfModule) ||
    jspdfModule;

  return { html2canvas, jsPDF };
};

// 辅助函数：将单个颜色字符串转换为 RGBA
const convertSingleColorToRgb = (color: string): string => {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return color;

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1, 1);
    const imageData = ctx.getImageData(0, 0, 1, 1).data;
    const r = imageData[0];
    const g = imageData[1];
    const b = imageData[2];
    const a = imageData[3];
    return `rgba(${r}, ${g}, ${b}, ${a / 255})`;
  } catch (e) {
    console.warn('颜色转换失败:', color, e);
    return color;
  }
};

// 辅助函数：替换字符串中的现代颜色格式
// 支持处理 box-shadow 等包含多个值的属性
const replaceModernColors = (value: string): string => {
  if (!value || typeof value !== 'string') return value;

  // 检查是否包含现代颜色格式
  if (!value.includes('lab(') && !value.includes('oklch(') && !value.includes('lch(')) {
    return value;
  }

  // 正则匹配 lab(...), oklch(...), lch(...)
  // 注意：这个简单的正则假设颜色函数内部没有嵌套括号
  return value.replace(/(?:lab|oklch|lch)\([^)]+\)/g, (match) => {
    return convertSingleColorToRgb(match);
  });
};

// 修复克隆文档中的颜色
const fixColors = (doc: Document) => {
  const allElements = doc.querySelectorAll('*');
  allElements.forEach((el) => {
    if (el instanceof HTMLElement) {
      const style = el.style;
      // 使用克隆文档的 window 对象获取计算样式
      const win = doc.defaultView || window;
      const computedStyle = win.getComputedStyle(el);

      // 需要检查的属性列表
      const properties = [
        'color',
        'backgroundColor',
        'borderColor',
        'outlineColor',
        'borderTopColor',
        'borderBottomColor',
        'borderLeftColor',
        'borderRightColor',
        'boxShadow',
        'textShadow',
        'fill',
        'stroke'
      ];

      properties.forEach((prop) => {
        // 使用类型断言访问样式属性
        const val = computedStyle[prop as any];
        if (val && (val.includes('lab(') || val.includes('oklch(') || val.includes('lch('))) {
          style[prop as any] = replaceModernColors(val);
        }
      });
    }
  });
};

export const exportToPDF = async (
  element: HTMLElement,
  fileName: string
): Promise<void> => {
  try {
    // 加载导出库（带重试机制）
    const { html2canvas, jsPDF } = await loadExportLibraries();

    // 确保元素存在且已渲染
    if (!element || !element.offsetParent) {
      throw new Error('元素未准备好，请稍后重试');
    }

    // 等待所有内容完全渲染（包括AI生成的内容）
    // 确保所有动态内容、图表、图片都已加载
    await new Promise(resolve => setTimeout(resolve, 300));

    // 滚动到顶部确保从开始捕获
    const originalScrollY = window.scrollY;
    const originalScrollX = window.scrollX;
    window.scrollTo(0, 0);
    await new Promise(resolve => setTimeout(resolve, 200));

    // 计算实际需要的高度和宽度
    const actualHeight = Math.max(
      element.scrollHeight,
      element.offsetHeight,
      element.clientHeight
    );

    const actualWidth = Math.max(
      element.scrollWidth,
      element.offsetWidth,
      element.clientWidth
    );

    console.log('导出尺寸:', { width: actualWidth, height: actualHeight });

    // 使用 html2canvas 捕获元素
    const canvas = await html2canvas(element, {
      scale: 2, // 提高清晰度
      useCORS: true,
      allowTaint: true, // 允许跨域图片
      logging: false,
      backgroundColor: '#ffffff',
      width: actualWidth,
      height: actualHeight,
      scrollX: 0,
      scrollY: 0,
      windowWidth: actualWidth,
      windowHeight: actualHeight,
      // 避免解析现代 CSS 颜色函数
      foreignObjectRendering: false,
      removeContainer: true,
      ignoreElements: (el: Element) => {
        // 只忽略明确标记的元素（如按钮、设置等）
        return el.classList.contains('no-print') ||
          el.classList.contains('no-export') ||
          (el.tagName === 'BUTTON' && !el.classList.contains('print-keep'));
      },
      onclone: (clonedDoc: Document) => {
        // 修复颜色问题
        fixColors(clonedDoc);

        // 确保克隆文档中的所有样式都正确
        const clonedElement = clonedDoc.querySelector('.print-content');
        if (clonedElement) {
          (clonedElement as HTMLElement).style.width = `${actualWidth}px`;
          (clonedElement as HTMLElement).style.height = `${actualHeight}px`;
          (clonedElement as HTMLElement).style.overflow = 'visible';
        }

        // 确保所有图片和样式都加载
        const images = clonedDoc.querySelectorAll('img');
        images.forEach((img) => {
          (img as HTMLImageElement).style.display = 'block';
        });
      },
    });

    // 恢复滚动位置
    window.scrollTo(originalScrollX, originalScrollY);

    if (!canvas) {
      throw new Error('无法生成画布');
    }

    const imgData = canvas.toDataURL('image/png', 1.0);
    if (!imgData || imgData === 'data:,') {
      throw new Error('无法生成图片数据');
    }

    // 创建 PDF
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgWidth = 210; // A4 宽度（mm）
    const pageHeight = 297; // A4 高度（mm）
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    let heightLeft = imgHeight;
    let position = 0;

    // 添加第一页
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
    heightLeft -= pageHeight;

    // 如果内容超过一页，添加更多页面
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
    }

    // 保存 PDF
    pdf.save(`${fileName}_分析报告_${new Date().toISOString().split('T')[0]}.pdf`);
  } catch (error) {
    console.error('导出 PDF 失败:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw new Error(`导出 PDF 时发生错误: ${errorMessage}`);
  }
};

/**
 * 导出 Dashboard 为 PNG
 * @param element - 要导出的元素
 * @param fileName - 文件名（不含扩展名）
 */
export const exportToPNG = async (
  element: HTMLElement,
  fileName: string
): Promise<void> => {
  try {
    // 加载 html2canvas（带重试机制）
    // 优先使用 html2canvas-pro（支持现代颜色函数）
    const loadWithRetry = async (retries = 3): Promise<any> => {
      for (let i = 0; i < retries; i++) {
        try {
          // 优先尝试 html2canvas-pro
          try {
            const mod = await import('html2canvas-pro');
            return mod.default || mod;
          } catch {
            // 如果 html2canvas-pro 失败，回退到 html2canvas
            const mod = await import('html2canvas');
            return mod.default || mod;
          }
        } catch (error) {
          console.warn(`导入 html2canvas 失败，重试 ${i + 1}/${retries}:`, error);
          if (i === retries - 1) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 500 * (i + 1)));
        }
      }
    };

    const html2canvas = await loadWithRetry();

    // 确保元素存在且已渲染
    if (!element || !element.offsetParent) {
      throw new Error('元素未准备好，请稍后重试');
    }

    // 等待元素完全渲染
    await new Promise(resolve => setTimeout(resolve, 200));

    // 滚动到顶部确保从开始捕获
    window.scrollTo(0, 0);
    await new Promise(resolve => setTimeout(resolve, 100));

    // 计算实际需要的高度
    const actualHeight = Math.max(
      element.scrollHeight,
      element.offsetHeight,
      element.clientHeight
    );

    const actualWidth = Math.max(
      element.scrollWidth,
      element.offsetWidth,
      element.clientWidth
    );

    // 克隆元素以避免修改原始元素
    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.style.position = 'absolute';
    clonedElement.style.left = '-9999px';
    clonedElement.style.top = '0';
    clonedElement.style.width = `${actualWidth}px`;
    clonedElement.style.height = `${actualHeight}px`;
    clonedElement.style.overflow = 'visible';
    document.body.appendChild(clonedElement);

    // 等待克隆元素渲染
    await new Promise(resolve => setTimeout(resolve, 200));

    try {
      // 使用 html2canvas 捕获元素，修复颜色问题
      const canvas = await html2canvas(clonedElement, {
        scale: 1.5,
        useCORS: true,
        allowTaint: false, // 改为 false 避免跨域问题
        logging: false,
        backgroundColor: '#ffffff', // 使用白色背景
        width: actualWidth,
        height: actualHeight,
        scrollX: 0,
        scrollY: 0,
        windowWidth: actualWidth,
        windowHeight: actualHeight,
        ignoreElements: (el: Element) => {
          // 忽略可能导致问题的元素
          return el.classList.contains('no-print') ||
            el.classList.contains('no-export');
        },
        onclone: (clonedDoc: Document) => {
          // 修复颜色问题
          fixColors(clonedDoc);

          // 确保所有图片和样式都加载
          const images = clonedDoc.querySelectorAll('img');
          images.forEach((img) => {
            (img as HTMLImageElement).style.display = 'block';
          });
        },
      });

      // 移除克隆元素
      document.body.removeChild(clonedElement);

      if (!canvas) {
        throw new Error('无法生成画布');
      }

      // 转换为 blob 并下载
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob: Blob | null) => {
            if (!blob) {
              reject(new Error('无法生成图片'));
              return;
            }

            try {
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = url;
              link.download = `${fileName}_分析报告_${new Date().toISOString().split('T')[0]}.png`;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(url);
              resolve();
            } catch (error) {
              reject(error);
            }
          },
          'image/png',
          0.95 // 稍微降低质量以避免问题
        );
      });
    } catch (error) {
      // 确保移除克隆元素
      if (document.body.contains(clonedElement)) {
        document.body.removeChild(clonedElement);
      }
      throw error;
    }
  } catch (error) {
    console.error('导出 PNG 失败:', error);
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    throw new Error(`导出 PNG 时发生错误: ${errorMessage}`);
  }
};
