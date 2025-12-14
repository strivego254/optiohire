'use client'

import * as React from "react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

interface SingleDateTimePickerProps {
  value?: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  minDateTime?: string
}

export function SingleDateTimePicker({
  value,
  onChange,
  placeholder = "Pick a date and time",
  className,
  disabled,
  minDateTime,
}: SingleDateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<string>('')
  const [selectedTime, setSelectedTime] = React.useState<string>('')

  React.useEffect(() => {
    if (!value || value.trim() === '') {
      setSelectedDate('')
      setSelectedTime('')
      return
    }

    try {
      const parsed = new Date(value)
      if (isNaN(parsed.getTime())) {
        console.warn('Invalid date value received:', value)
        setSelectedDate('')
        setSelectedTime('')
        return
      }

      // Format date as YYYY-MM-DD for input[type="date"]
      setSelectedDate(format(parsed, 'yyyy-MM-dd'))
      setSelectedTime(format(parsed, 'HH:mm'))
    } catch (err) {
      console.warn('Error parsing date value:', value, err)
      setSelectedDate('')
      setSelectedTime('')
    }
  }, [value])

  const handleDateChange = React.useCallback(
    (date: string) => {
      setSelectedDate(date)
      if (date) {
        const time = selectedTime || '00:00'
        const combined = `${date}T${time}`
        const combinedDate = new Date(combined)
        
        // Validate date before using it
        if (isNaN(combinedDate.getTime())) {
          console.warn('Invalid date value:', combined)
          onChange('')
          return
        }
        
        if (minDateTime) {
          const minDate = new Date(minDateTime)
          if (isNaN(minDate.getTime())) {
            console.warn('Invalid minDateTime:', minDateTime)
          } else if (combinedDate < minDate) {
            return
          }
        }
        
        onChange(format(combinedDate, "yyyy-MM-dd'T'HH:mm"))
      } else {
        onChange('')
      }
    },
    [selectedTime, minDateTime, onChange]
  )

  const handleTimeChange = React.useCallback(
    (time: string) => {
      setSelectedTime(time)
      if (selectedDate && time) {
        const combined = `${selectedDate}T${time}`
        const combinedDate = new Date(combined)
        
        // Validate date before using it
        if (isNaN(combinedDate.getTime())) {
          console.warn('Invalid date value:', combined)
          return
        }
        
        if (minDateTime) {
          const minDate = new Date(minDateTime)
          if (isNaN(minDate.getTime())) {
            console.warn('Invalid minDateTime:', minDateTime)
          } else if (combinedDate < minDate) {
            return
          }
        }
        
        onChange(format(combinedDate, "yyyy-MM-dd'T'HH:mm"))
      }
    },
    [selectedDate, minDateTime, onChange]
  )

  // Safely get minDate and minTime
  let minDate: string | undefined = undefined
  let minTime: string | undefined = undefined
  
  if (minDateTime) {
    try {
      const minDateObj = new Date(minDateTime)
      if (!isNaN(minDateObj.getTime())) {
        minDate = format(minDateObj, 'yyyy-MM-dd')
        if (selectedDate === minDate) {
          minTime = format(minDateObj, 'HH:mm')
        }
      }
    } catch (err) {
      console.warn('Invalid minDateTime:', minDateTime, err)
    }
  }

  return (
    <div className={cn("relative w-full space-y-3", className)}>
      <div className={disabled ? "pointer-events-none opacity-50" : undefined}>
        <div className="space-y-3">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              min={minDate}
              className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:border-[#2D2DDD] dark:focus:border-gray-600 focus:ring-0 border-focus-thin"
              disabled={disabled}
            />
          </div>
          
          {selectedDate && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Time</label>
              <input
                type="time"
                value={selectedTime}
                onChange={(e) => handleTimeChange(e.target.value)}
                min={minTime}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md text-gray-900 dark:text-white focus:outline-none focus:border-[#2D2DDD] dark:focus:border-gray-600 focus:ring-0 border-focus-thin"
                disabled={disabled}
              />
            </div>
          )}
        </div>
      </div>
      
      {!selectedDate && (
        <p className="mt-2 text-xs text-muted-foreground">{placeholder}</p>
      )}
      {selectedDate && selectedTime && (() => {
        const displayDate = new Date(`${selectedDate}T${selectedTime}`)
        if (isNaN(displayDate.getTime())) {
          return null
        }
        return (
          <p className="mt-2 text-xs text-muted-foreground">
            Selected {format(displayDate, "MMM dd, yyyy 'at' HH:mm")}
          </p>
        )
      })()}
    </div>
  )
}

