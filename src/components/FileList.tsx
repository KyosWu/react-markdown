import React, { useState, useEffect, useRef } from 'react'
// svg css 样式
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { faMarkdown } from '@fortawesome/free-brands-svg-icons'
// hooks
import useKeyPress from '../hooks/useKeyPress'
import useContextMenu from '../hooks/useContextMenu'
// 工具
import { getParentNode } from '../utils/helper'
// typescript
import FILELIST from "../typescript/filelist"
// 类型校验
import PropTypes from 'prop-types'


const FileList = ( { files, onFileClick, onSaveEdit, onFileDelete }:FILELIST) => {

  const [ editStatus, setEditStatus ] = useState(false)
  const [ value, setValue ] = useState('')
  const enterPressed = useKeyPress(13)
  const escPressed = useKeyPress(27)
  let node = useRef(null)

  // 关闭搜索
  const closeSearch = (editItem:any) => {
    setEditStatus(false)
    setValue('')
    // if we are editing a newly created file, we should delete this file when pressing esc
    if (editItem.isNew) {
      onFileDelete(editItem.id)
    }
  }
  // 右击条目触发
  const clickedItem = useContextMenu([
    {
      label: '打开',
      click: () => {
        const parentElement = getParentNode(clickedItem.current, 'file-item')
        if (parentElement) {
          onFileClick(parentElement.dataset.id)
        }
      }
    },
    {
      label: '重命名',
      click: () => {
        const parentElement = getParentNode(clickedItem.current, 'file-item')
        if (parentElement) {
          const { id, title } = parentElement.dataset
          setEditStatus(id)
          setValue(title)
        }
      }
    },
    {
      label: '删除',
      click: () => {
        const parentElement = getParentNode(clickedItem.current, 'file-item')
        if (parentElement) {
          onFileDelete(parentElement.dataset.id)
        }
      }
    },
  ], '.file-list', [files])

  // 监听editItem 修改条目
  useEffect(() => {
    const editItem = files.find((file:any) => file.id === editStatus)
    if (enterPressed && editStatus && value.trim() !== '') {
      onSaveEdit(editItem.id, value, editItem.isNew)
      setEditStatus(false)
      setValue('')
    }
    if(escPressed && editStatus) {
      closeSearch(editItem)
    }
  })
  // 监听 newFile 创建新文件
  useEffect(() => {
    const newFile = files.find((file:any) => file.isNew)
    if (newFile) {
      setEditStatus(newFile.id)
      setValue(newFile.title)
    }
  }, [files])
  // 监听editStatus 编辑状态改变
  useEffect(() => {
    if (editStatus) {
      // @ts-ignore
      node.current.focus()
    }
  }, [editStatus])

  return (
    <ul className="list-group list-group-flush file-list">
      {
        files.map((file:any) => (
          <li
            className="list-group-item bg-light row d-flex align-items-center file-item mx-0"
            key={file.id}
            data-id={file.id}
            data-title={file.title}
          >
            { (file.id !== editStatus && !file.isNew) &&
            <>
              <span className="col-2">
                <FontAwesomeIcon
                  size="lg"
                  icon={faMarkdown}
                />
              </span>
              <span
                className="col-10 c-link"
                onClick={() => {onFileClick(file.id)}}
              >
                {file.title}
              </span>
            </>
            }
            { ((file.id === editStatus) || file.isNew) &&
              <>
                <input
                  className="form-control col-10"
                  ref={node}
                  value={value}
                  placeholder="请输入文件名称"
                  onChange={(e) => { setValue(e.target.value) }}
                />
                <button
                  type="button"
                  className="icon-button col-2"
                  onClick={() => {closeSearch(file)}}
                >
                  <FontAwesomeIcon
                    title="关闭"
                    size="lg"
                    icon={faTimes}
                  />
                </button>
              </>
            }
          </li>
        ))
      }
    </ul>
  )
}

FileList.propTypes = {
  files: PropTypes.array,
  onFileClick: PropTypes.func,
  onFileDelete: PropTypes.func,
  onSaveEdit: PropTypes.func,
}
export default FileList
