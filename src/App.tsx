import React, {useState} from 'react'
// @ts-ignore
import uuidv4 from 'uuid/v4'
// css样式
import './style/App.scss'
import 'bootstrap/dist/css/bootstrap.min.css'
import { faPlus, faFileImport } from '@fortawesome/free-solid-svg-icons'
// markdown 编辑器
import SimpleMDE from "react-simplemde-editor"
import "easymde/dist/easymde.min.css"
// 工具
import { flattenArr, objToArr, timestampToString, extraKeys} from './utils/helper'
// 文件搜索
import FileSearch from './components/FileSearch'
// 文件列表
import FileList from './components/FileList'
// 按钮
import BottomBtn from './components/BottomBtn'
// tab 列表
import TabList from './components/TabList'
import Loader from './components/Loader'

import useIpcRenderer from './hooks/useIpcRenderer'
const fs = window.require('fs')
const Store = window.require('electron-store')
const { join, basename, extname, dirname } = window.require('path')
const { remote, ipcRenderer } = window.require('electron')
const fileStore = new Store({'name': 'Files Data'})


function App() {

  const [ files, setFiles ] = useState(fileStore.get('files') || {})
  const [ searchedFiles, setSearchedFiles ] = useState<any>([])
  const [ activeFileID, setActiveFileID ] =useState<any>('')
  const [ openedFileIDs, setOpenedFileIDs ] = useState<any>([])
  const [ unsavedFileIDs, setUnsavedFileIDs ] = useState([])
  const [ isLoading, setLoading ] = useState(false)

  // 激活的文件
  const activeFile = files[activeFileID]
  // 打开的文件
  const openedFiles = openedFileIDs.map((openID:number) => {
    return files[openID]
  })
  // 文件的列表
  const filesArr = objToArr(files)
  // 文件数组
  const fileListArr = (searchedFiles.length > 0) ? searchedFiles : filesArr
  const settingsStore = new Store({name: 'Settings'})
  const savedLocation = settingsStore.get('savedFileLocation') || remote.app.getPath('documents')
  // 同步函数
  const getAutoSync = () => ['accessKey', 'secretKey', 'bucketName', 'enableAutoSync'].every(key => !!settingsStore.get(key))
  // 保存文件到electron-store
  const saveFilesToStore = (files:any) => {
    // we don't have to store any info in file system, eg: isNew, body ,etc
    const filesStoreObj = objToArr(files).reduce((result, file) => {
      const { id, path, title, createdAt, isSynced, updatedAt } = file
      result[id] = {
        id,
        path,
        title,
        createdAt,
        isSynced,
        updatedAt
      }
      return result
    }, {})
    // 保存至electron-store
    fileStore.set('files', filesStoreObj)
  }
  // tab 关闭
  const tabClose = (id:any) => {
    //remove current id from openedFileIDs
    const tabsWithout = openedFileIDs.filter((fileID:any) => fileID !== id)
    setOpenedFileIDs(tabsWithout)
    // set the active to the first opened tab if still tabs left
    if (tabsWithout.length > 0) {
      setActiveFileID(tabsWithout[0])
    } else {
      setActiveFileID('')
    }
  }
  // tab 点击
  const tabClick = (fileID:any) => {
    // set current active file
    setActiveFileID(fileID)
  }
  // 文件搜索
  const fileSearch = (keyword:any) => {
    // filter out the new files based on the keyword
    const newFiles = filesArr.filter((file) => file.title.includes(keyword))
    setSearchedFiles(newFiles)
  }
  // 文件点击事件
  const fileClick = (fileID:any) => {
    // set current active file
    setActiveFileID(fileID)
    const currentFile = files[fileID]
    const { id, title, path, isLoaded } = currentFile
    if (!isLoaded) {
      if (getAutoSync()) {
        ipcRenderer.send('download-file', { key: `${title}.md`, path, id })
      } else {
        fs.readFile(currentFile.path,{ encoding: 'utf8'}, function(value:any){
          const newFile = { ...files[fileID], body: value, isLoaded: true }
          setFiles({ ...files, [fileID]: newFile })
        })
      }
    }
    // if openedFiles don't have the current ID
    // then add new fileID to openedFiles
    if (!openedFileIDs.includes(fileID)) {
      setOpenedFileIDs([ ...openedFileIDs, fileID ])
    }
  }
  // 新建文件
  const createNewFile = () => {
    const newID = uuidv4()
    const newFile = {
      id: newID,
      title: '',
      body: '## 请输出 Markdown',
      createdAt: new Date().getTime(),
      isNew: true,
    }
    setFiles({ ...files, [newID]: newFile })
  }
  // 导入文件
  const importFiles = () => {
    remote.dialog.showOpenDialog({
      title: '选择导入的 Markdown 文件',
      properties: ['openFile', 'multiSelections'],
      filters: [
        {name: 'Markdown files', extensions: ['md']}
      ]
    }).then((paths:any) => {
      // console.log(Array.isArray(paths.filePaths))
      if (Array.isArray(paths.filePaths)) {
        const path = paths.filePaths
        // filter out the path we already have in electron store
        // ["/Users/liusha/Desktop/name1.md", "/Users/liusha/Desktop/name2.md"]
        const filteredPaths = path.filter((path:any) => {
          const alreadyAdded = Object.values(files).find((file:any) => {
            return file.path === path
          })
          return !alreadyAdded
        })
        // extend the path array to an array contains files info
        // [{id: '1', path: '', title: ''}, {}]
        const importFilesArr = filteredPaths.map((path:string) => {
          return {
            id: uuidv4(),
            title: basename(path, extname(path)),
            path,
          }
        })
        // console.log(importFilesArr)
        // get the new files object in flattenArr
        const newFiles = { ...files, ...flattenArr(importFilesArr)}
        // setState and update electron store
        setFiles(newFiles)
        saveFilesToStore(newFiles)
        if (importFilesArr.length > 0) {
          remote.dialog.showMessageBox({
            type: 'info',
            title: `成功导入了${importFilesArr.length}个文件`,
            message: `成功导入了${importFilesArr.length}个文件`,
          })
        }
      }
    })
  }
  // 删除文件
  const deleteFile = (id:number) => {
    if (files[id].isNew) {
      const { [id]: value, ...afterDelete } = files
      setFiles(afterDelete)
    } else {
      fs.unlink(files[id].path, function () {
        const { [id]: value, ...afterDelete } = files
        setFiles(afterDelete)
        saveFilesToStore(afterDelete)
        // close the tab if opened
        tabClose(id)
      })
    }
  }
  // 更新文件名
  const updateFileName = (id:number, title:string, isNew:boolean) => {
    // newPath should be different based on isNew
    // if isNew is false, path should be old dirname + new title
    const newPath = isNew ? join(savedLocation, `${title}.md`)
        : join(dirname(files[id].path), `${title}.md`)
    const modifiedFile = {...files[id], title, isNew: false, path: newPath}
    const newFiles = {...files, [id]: modifiedFile}
    if (isNew) {
      fs.writeFile(newPath, files[id].body,{ encoding: 'utf8'},function() {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    } else {
      const oldPath = files[id].path
      fs.rename(oldPath, newPath, function () {
        setFiles(newFiles)
        saveFilesToStore(newFiles)
      })
    }
  }
  // 判断文件是否发生变化
  const fileChange = (id:number, value:any) => {
    if (value !== files[id].body) {
      const newFile = { ...files[id], body: value }
      setFiles({ ...files, [id]: newFile })
      // update unsavedIDs
      // @ts-ignore
      if (!unsavedFileIDs.includes(id)) {
        // @ts-ignore
        setUnsavedFileIDs([ ...unsavedFileIDs, id])
      }
    }
  }
  // 以下支持electron
  const saveCurrentFile = () => {
    const { path, body, title } = activeFile
    fs.writeFile(path, body, function () {
      setUnsavedFileIDs(unsavedFileIDs.filter(id => id !== activeFile.id))
      if (getAutoSync()) {
        ipcRenderer.send('upload-file', {key: `${title}.md`, path })
      }
    })
  }
  const activeFileUploaded = () => {
    const { id } = activeFile
    const modifiedFile = { ...files[id], isSynced: true, updatedAt: new Date().getTime() }
    const newFiles = { ...files, [id]: modifiedFile }
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }
  const activeFileDownloaded = (event:any, message:any) => {
    const currentFile = files[message.id]
    const { id, path } = currentFile
    fs.readFile(path, function (value:any) {
      let newFile
      if (message.status === 'download-success') {
        newFile = { ...files[id], body: value, isLoaded: true, isSynced: true, updatedAt: new Date().getTime() }
      } else {
        newFile = { ...files[id], body: value, isLoaded: true}
      }
      const newFiles = { ...files, [id]: newFile }
      setFiles(newFiles)
      saveFilesToStore(newFiles)
    })
  }
  const filesUploaded = () => {
    const newFiles = objToArr(files).reduce((result, file) => {
      const currentTime = new Date().getTime()
      result[file.id] = {
        ...files[file.id],
        isSynced: true,
        updatedAt: currentTime,
      }
      return result
    }, {})
    setFiles(newFiles)
    saveFilesToStore(newFiles)
  }
  // electron IPC
  useIpcRenderer({
    // key 为menuTemplate 中定义的监听名称 value为react的函数方法
    'create-new-file': createNewFile,
    'import-file': importFiles,
    'save-edit-file': saveCurrentFile,
    'active-file-uploaded': activeFileUploaded,
    'file-downloaded': activeFileDownloaded,
    'files-uploaded': filesUploaded,
    'loading-status': (message:any, status:any) => { setLoading(status) }
  })

  return (
      <div className="App container-fluid px-0">
        { isLoading &&
        <Loader />
        }
        <div className="row no-gutters">
          <div className="col-3 bg-light left-panel">
            {/*文件搜索*/}
            <FileSearch
                title='My Document'
                onFileSearch={fileSearch}
            />
            {/*文件列表*/}
            <FileList
                files={fileListArr}
                onFileClick={fileClick}
                onFileDelete={deleteFile}
                onSaveEdit={updateFileName}
            />
            <div className="row no-gutters button-group">
              <div className="col">
                <BottomBtn
                    text="新建"
                    colorClass="btn-primary"
                    icon={faPlus}
                    onBtnClick={createNewFile}
                />
              </div>
              <div className="col">
                <BottomBtn
                    text="导入"
                    colorClass="btn-success"
                    icon={faFileImport}
                    onBtnClick={importFiles}
                />
              </div>
            </div>
          </div>
          <div className="col-9 right-panel">
            { !activeFile &&
            <div className="start-page">
              选择或者创建新的 Markdown 文档
            </div>
            }
            { activeFile &&
            <>
              {/*tab 列表*/}
              <TabList
                  files={openedFiles}
                  activeId={activeFileID}
                  unsaveIds={unsavedFileIDs}
                  onTabClick={tabClick}
                  onCloseTab={tabClose}
              />
              {/*markdown 编辑器*/}
              <SimpleMDE
                  key={activeFile && activeFile.id}
                  value={activeFile && activeFile.body}
                  onChange={(value:any) => {fileChange(activeFile.id, value)}}
                  extraKeys={extraKeys}
                  options={{
                    minHeight: '515px',
                    autofocus: true,
                    spellChecker: false,
                  }}
              />
              { activeFile.isSynced &&
              <span className="sync-status">已同步，上次同步{timestampToString(activeFile.updatedAt)}</span>
              }
            </>
            }
          </div>
        </div>
      </div>
  )
}

export default App
