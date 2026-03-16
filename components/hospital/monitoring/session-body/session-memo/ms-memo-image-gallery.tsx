import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Dialog, DialogContent } from '@/components/ui/dialog'

type Props = {
  imgUrls: string[]
  isGalleryOpen: boolean
  setIsGalleryOpen: (open: boolean) => void
  selectedImageIndex: number
}

export default function MsMemoImageGallery({
  imgUrls,
  isGalleryOpen,
  setIsGalleryOpen,
  selectedImageIndex,
}: Props) {
  if (!imgUrls || imgUrls.length === 0) return null

  return (
    <Dialog open={isGalleryOpen} onOpenChange={setIsGalleryOpen}>
      <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none sm:rounded-none">
        <Carousel
          opts={{
            startIndex: selectedImageIndex,
            loop: true,
          }}
          className="w-full"
        >
          <CarouselContent>
            {imgUrls.map((url, idx) => (
              <CarouselItem
                key={idx}
                className="flex h-[80vh] items-center justify-center cursor-pointer"
                onClick={() => setIsGalleryOpen(false)} // 사진 아무데나 누르면 닫히도록 편의성 추가
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`memo attachment full view ${idx + 1}`}
                  className="max-h-full w-auto max-w-full rounded-md object-contain"
                />
              </CarouselItem>
            ))}
          </CarouselContent>
          {imgUrls.length > 1 && (
            <>
              <CarouselPrevious className="left-4 bg-black/50 text-white hover:bg-black/70 border-none" />
              <CarouselNext className="right-4 bg-black/50 text-white hover:bg-black/70 border-none" />
            </>
          )}
        </Carousel>
      </DialogContent>
    </Dialog>
  )
}
