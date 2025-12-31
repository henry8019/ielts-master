import { login } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-100 p-4 dark:bg-zinc-950">
            {/* 背景光晕装饰 */}
            <div className="absolute top-1/4 -left-10 h-72 w-72 rounded-full bg-blue-400/30 blur-[100px]" />
            <div className="absolute bottom-1/4 -right-10 h-72 w-72 rounded-full bg-purple-400/30 blur-[100px]" />

            <Card className="relative z-10 w-full max-w-[360px] border-white/20 bg-white/60 shadow-xl backdrop-blur-xl dark:bg-black/60">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight text-center">
                        IELTS Master
                    </CardTitle>
                    <CardDescription className="text-center">
                        输入你的专属访问凭证
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={login} className="flex flex-col gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">账号</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="zhanghao@ielts.com"
                                required
                                className="bg-white/50 dark:bg-black/20"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">密码</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="bg-white/50 dark:bg-black/20"
                            />
                        </div>
                        <Button type="submit" className="w-full mt-2">
                            进入系统
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}