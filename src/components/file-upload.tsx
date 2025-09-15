import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FileUploadProps {
  onFilesSelected: (files: File[]) => void
  acceptedTypes?: string[]
  multiple?: boolean
  uploadedFiles?: File[]
  onRemoveFile?: (index: number) => void
}

export function FileUpload({ 
  onFilesSelected, 
  acceptedTypes = ['.pdf', '.docx'], 
  multiple = true,
  uploadedFiles = [],
  onRemoveFile
}: FileUploadProps) {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    onFilesSelected(acceptedFiles)
  }, [onFilesSelected])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes.reduce((acc, type) => {
      if (type === '.pdf') acc['application/pdf'] = ['.pdf']
      if (type === '.docx') acc['application/vnd.openxmlformats-officedocument.wordprocessingml.document'] = ['.docx']
      if (type === '.txt') acc['text/plain'] = ['.txt']
      return acc
    }, {} as Record<string, string[]>),
    multiple
  })

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive 
            ? 'border-[#0E7C86] bg-[#0E7C86]/5' 
            : 'border-slate-300 hover:border-[#0E7C86] hover:bg-slate-50'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
        {isDragActive ? (
          <p className="text-[#0E7C86] font-medium">Drop the files here...</p>
        ) : (
          <div>
            <p className="text-slate-600 font-medium mb-2">
              Drag & drop files here, or click to browse
            </p>
            <p className="text-sm text-slate-500">
              Supports: {acceptedTypes.join(', ')} • {multiple ? 'Multiple files allowed' : 'Single file only'}
            </p>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-slate-700">Uploaded Files:</h4>
          {uploadedFiles.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-slate-500" />
                <div>
                  <p className="text-sm font-medium text-slate-700">{file.name}</p>
                  <p className="text-xs text-slate-500">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              {onRemoveFile && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveFile(index)}
                  className="text-slate-500 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}