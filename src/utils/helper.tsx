// 一维化数组
export const flattenArr = (arr:any) => {
  return arr.reduce((map:any, item:any) => {
    map[item.id] = item
    return map
  }, {})
}

// 对象转数组
export const objToArr = (obj:any) => {
  return Object.keys(obj).map(key => obj[key])
}

// 获取父节点
export const getParentNode = (node:any, parentClassName:any) => {
  let current = node
  while(current !== null) {
    if (current.classList.contains(parentClassName)) {
      return current
    }
    current = current.parentNode
  }
  return false
}

// 事件转字符串
export const timestampToString = (timestamp:any) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
}

export const extraKeys = {
  Up: function(cm:any) {
    cm.replaceSelection(" surprise. ");
  },
  Down: function(cm:any) {
    cm.replaceSelection(" surprise again! ");
  }
};
