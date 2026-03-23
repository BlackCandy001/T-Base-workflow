import React from "react";
import * as LucideIcons from "lucide-react";
import { getFileIconName, getFolderIconName, getProviderIconName } from "../../utils/fileIconMapper";

interface FileIconProps {
  path?: string;
  provider?: string;
  isFolder?: boolean;
  isOpen?: boolean;
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

const FileIcon: React.FC<FileIconProps> = ({
  path,
  provider,
  isFolder = false,
  isOpen = false,
  size = 16,
  className,
  style,
}) => {
  let iconName = "";
  if (provider) {
    iconName = getProviderIconName(provider);
  } else {
    iconName = isFolder
      ? getFolderIconName(isOpen)
      : getFileIconName(path || "");
  }

  // Convert kebab-case or snake-case to PascalCase for Lucide
  const toPascalCase = (str: string) => {
    return str
      .split("-")
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join("");
  };

  const pascalName = toPascalCase(iconName);
  const IconComponent = (LucideIcons as any)[pascalName] || (LucideIcons as any).File || null;

  if (!IconComponent) {
    return (
      <div 
        className={className} 
        style={{ 
          width: `${size}px`, 
          height: `${size}px`, 
          backgroundColor: "rgba(128, 128, 128, 0.2)", 
          borderRadius: "2px",
          ...style 
        }} 
      />
    );
  }

  return (
    <IconComponent
      className={className}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        ...style,
      }}
      strokeWidth={1.5}
    />
  );
};

export default FileIcon;
