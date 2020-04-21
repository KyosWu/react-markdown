import React, { useState, useEffect, useRef } from 'react'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faTimes } from '@fortawesome/free-solid-svg-icons'

import PropTypes from 'prop-types'
// 引入hooks
import useKeyPress from '../hooks/useKeyPress'
import useIpcRenderer from '../hooks/useIpcRenderer'
// import { FILESEARCH } from '../typescript/interface'
interface FILESEARCH {
  title: String,
  onFileSearch: any
}

const FileSearch = ({ title, onFileSearch }:FILESEARCH) => {

  const [ inputActive, setInputActive ] = useState(false)
  const [ value, setValue ] = useState('')
  const enterPressed = useKeyPress(13)
  const escPressed = useKeyPress(27)
  let node = useRef(null)

  // 开始搜索
  const startSearch = () => {
    setInputActive(true)
  }
  // 关闭搜索
  const closeSearch = () => {
    setInputActive(false)
    setValue('')
    onFileSearch(false)
  }
  // electron ipc 通信
  useIpcRenderer({
    'search-file': startSearch
  })
  // 监听 enterPressed inputActive
  useEffect(() => {
    if (enterPressed && inputActive) {
      onFileSearch(value)
    }
    if(escPressed && inputActive) {
      closeSearch()
    }
  })
  // 监听 inputActive
  useEffect(() => {
    if (inputActive) {
      // @ts-ignore
      node.current.focus()
    }
  }, [inputActive])

  return (
    <div className="alert alert-primary d-flex justify-content-between align-items-center mb-0">
      { !inputActive &&
        <>
          <span>{title}</span>
          <button
            type="button"
            className="icon-button"
            onClick={startSearch}
          >
            <FontAwesomeIcon
              title="搜索"
              size="lg"
              icon={faSearch}
            />
          </button>
        </>
      }
      { inputActive &&
        <>
          <input
            className="form-control"
            value={value}
            ref={node}
            onChange={(e) => { setValue(e.target.value) }}
          />
          <button
            type="button"
            className="icon-button"
            onClick={closeSearch}
          >
            <FontAwesomeIcon
              title="关闭"
              size="lg"
              icon={faTimes}
            />
          </button>
        </>
      }
    </div>
  )
}

// 属性检查
FileSearch.propTypes = {
  title: PropTypes.string,
  onFileSearch: PropTypes.func.isRequired,
}

FileSearch.defaultProps = {
  title: '我的云文档'
}

export default FileSearch
