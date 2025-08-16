export type Constructor<T = {}> = new (...args: any[]) => T;
export type Factory<T = any> = (...args: any[]) => T;

export interface ServiceDefinition {
  factory: Factory;
  dependencies?: string[];
  singleton?: boolean;
  instance?: any;
}

export class DIContainer {
  private services = new Map<string, ServiceDefinition>();
  private instances = new Map<string, any>();

  // Đăng ký service
  register<T>(
    token: string,
    factory: Factory<T>,
    options: {
      dependencies?: string[];
      singleton?: boolean;
    } = {}
  ): this {
    this.services.set(token, {
      factory,
      dependencies: options.dependencies || [],
      singleton: options.singleton !== false, // Mặc định là singleton
    });
    return this;
  }

  // Đăng ký class
  registerClass<T>(
    token: string,
    constructor: Constructor<T>,
    options: {
      dependencies?: string[];
      singleton?: boolean;
    } = {}
  ): this {
    return this.register(token, (...deps) => new constructor(...deps), options);
  }

  // Đăng ký instance có sẵn
  registerInstance<T>(token: string, instance: T): this {
    this.instances.set(token, instance);
    this.services.set(token, {
      factory: () => instance,
      singleton: true,
      instance,
    });
    return this;
  }

  // Resolve service
  resolve<T>(token: string): T {
    // Kiểm tra xem đã có instance chưa
    if (this.instances.has(token)) {
      return this.instances.get(token);
    }

    const serviceDefinition = this.services.get(token);
    if (!serviceDefinition) {
      throw new Error(`Service "${token}" not found`);
    }

    // Resolve dependencies
    const dependencies =
      serviceDefinition.dependencies?.map((dep) => this.resolve(dep)) || [];

    // Tạo instance
    const instance = serviceDefinition.factory(...dependencies);

    // Cache nếu là singleton
    if (serviceDefinition.singleton) {
      this.instances.set(token, instance);
      serviceDefinition.instance = instance;
    }

    return instance;
  }

  // Kiểm tra service đã được đăng ký chưa
  has(token: string): boolean {
    return this.services.has(token);
  }

  // Clear tất cả instances (useful for testing)
  clear(): void {
    this.instances.clear();
  }
}
